package de.scytec.abhakeln.db;

import io.reactivex.Maybe;
import io.reactivex.Single;
import io.vertx.core.Promise;
import io.vertx.core.eventbus.DeliveryOptions;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.AbstractVerticle;
import io.vertx.reactivex.core.MultiMap;
import io.vertx.reactivex.core.eventbus.Message;
import io.vertx.reactivex.ext.mongo.MongoClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

public class DbVerticle extends AbstractVerticle {

    private static final Logger LOGGER = LoggerFactory.getLogger(DbVerticle.class);

    private MongoClient mongoClient;

    @Override
    public void start(Promise<Void> promise) {
        LOGGER.info("Starting " + this.getClass().getSimpleName());

        mongoClient = MongoClient.createShared(vertx, new DbConfig().get(config()));
        vertx.eventBus().consumer("db-queue", this::onMessage);

        mongoClient.rxFindOne("lists", new JsonObject(), new JsonObject()).subscribe(list -> {
        }, err -> {
            LOGGER.error("Could not read from database", err);
        });

        promise.complete();
    }

    private void onMessage(Message<JsonObject> msg) {
        switch (msg.headers().get("action")) {
            case "get-lists":
                this.findLists(msg);
                break;
            case "create-list":
                this.createList(msg);
                break;
            case "get-list-data":
                this.getListData(msg);
                break;
            case "get-all-items":
                this.getAllItems(msg);
                break;
            case "create-list-item":
                this.createListItem(msg);
                break;
            case "update-list-data":
                this.updateList(msg);
                break;
            case "update-list-itemorder":
                this.updateListItemOrder(msg);
                break;
            case "update-item-data":
                this.updateListItem(msg);
                break;
            case "confirm-share-list":
                this.confirmShareList(msg);
                break;
            case "share-list":
                this.shareList(msg);
                break;
            case "create-push-subscription":
                this.createPushSubscription(msg);
                break;
            case "get-notifications":
                this.getNotifications(msg);
                break;
        }
    }

    private void getNotifications(Message<JsonObject> msg) {
        JsonObject query = new JsonObject()
                .put("reminder", new JsonObject()
                        .put("$lte", ZonedDateTime.now(ZoneId.of("UTC")).toString())
                        .put("$ne", ""))
                .put("reminderSent", new JsonObject()
                        .put("$exists", false));

        mongoClient.rxFind("items",
                query)
                .flatMap(items -> {
                    Map<String, Maybe<List<String>>> listOwners = new HashMap<>();
                    items.forEach(item -> {
                        listOwners.computeIfAbsent(item.getString("listId"), listId -> getListOwners(listId));

                        // FIXME this will block the thread!
                        item.put("owners", new JsonArray(listOwners.get(item.getString("listId")).blockingGet()));

                    });
                    LOGGER.info("" + listOwners.size());
                    return Single.just(items);
                })
                .flatMap(items -> {
                    Set<String> owners = new HashSet<>();
                    items.forEach(item -> owners.addAll(item.getJsonArray("owners").getList()));
                    return mongoClient.rxFind("subscriptions", new JsonObject().put("userId", new JsonObject().put("$in", new JsonArray(new ArrayList<>(owners))))).map(subs -> {
                        subs.forEach(sub -> {
                            List<JsonObject> subItems = items.stream().filter(item -> item.getJsonArray("owners").contains(sub.getString("userId"))).collect(Collectors.toList());
                            sub.put("items", subItems);
                        });
                        return subs;
                    });
                })
                .subscribe(result -> {
                    JsonObject listData = new JsonObject();
                    listData.put("notifications", new JsonArray(result));
                    msg.reply(listData);
                });
    }

    private void createPushSubscription(Message<JsonObject> msg) {
        mongoClient.rxSave("push-subscriptions", msg.body()).subscribe(msg::reply);
    }

    private void updateListItem(Message<JsonObject> msg) {
        JsonObject body = msg.body();
        MultiMap headers = msg.headers();
        String itemId = body.getString("itemId");
        String userId = body.getString("userId");
        body.remove("itemId");
        body.remove("userId");

        final AtomicReference<JsonArray> listOwners = new AtomicReference<>();
        final AtomicReference<String> listId = new AtomicReference<>();
        mongoClient.rxFindOne("items", new JsonObject().put("_id", itemId), null)
                .map(item -> item.getString("listId"))
                .flatMap(id -> Single.just(listId.updateAndGet(i -> id)).toMaybe())
                .flatMap(id -> userHasListAccess(userId, id))
                .flatMap(hasAccess -> {
                    listOwners.set(hasAccess);

                    if (headers.contains("sub-action") && headers.get("sub-action").equals("update-sortorder")) {
                        mongoClient.rxUpdateCollection("items", new JsonObject().put("sortOrder",
                                new JsonObject().put("$gte", body.getInteger("sortOrder"))),
                                new JsonObject().put("$inc", new JsonObject().put("sortOrder", 1)));
                    }

                    return mongoClient.rxUpdateCollection("items", new JsonObject().put("_id", itemId), body);
                })
                .flatMap(updateResult -> mongoClient.rxFindOne("items", new JsonObject().put("_id", itemId), null))
                .subscribe(result -> {
                    msg.reply(result);
                    DeliveryOptions options = new DeliveryOptions()
                            .addHeader("action", "update-item-data")
                            .addHeader("for-users", String.valueOf(listOwners.get()));
                    vertx.eventBus().publish("sync-queue", result, options);
                });
    }

    private void createListItem(Message<JsonObject> msg) {
        final AtomicReference<JsonArray> listOwners = new AtomicReference<>();
        JsonObject newItem = msg.body();
        userHasListAccess(newItem.getString("userId"), newItem.getString("listId"))
                .flatMap(hasAccess -> {
                    newItem.remove("userId");
                    listOwners.set(hasAccess);
                    return Single.just(newItem).toMaybe();
                })
                .flatMap(item -> mongoClient.rxSave("items", item))
                .subscribe(id -> {
                    msg.reply(newItem.put("_id", id));
                    DeliveryOptions options = new DeliveryOptions()
                            .addHeader("action", "create-list-item")
                            .addHeader("for-users", String.valueOf(listOwners.get()));
                    vertx.eventBus().publish("sync-queue", newItem, options);
                });
    }

    private void getListData(Message<JsonObject> msg) {
        JsonObject listInfo = msg.body();
        userHasListAccess(listInfo.getString("userId"), listInfo.getString("listId"))
                .flatMap(hasAccess -> mongoClient.rxFind("items",
                        new JsonObject().put("listId", listInfo.getString("listId"))).toMaybe())
                .subscribe(result -> {
                    JsonObject listData = new JsonObject();
                    listData.put("items", new JsonArray(result));
                    msg.reply(listData);
                });
    }

    private void getAllItems(Message<JsonObject> msg) {
        String userId = msg.body().getString("userId");

        mongoClient.rxFind("lists", new JsonObject().put("owners.userId", userId))
                .map(result -> result.stream().map(obj -> obj.getString("_id")).collect(Collectors.toList()))
                .flatMap(lists -> mongoClient.rxFind("items",
                        new JsonObject().put("listId",
                                new JsonObject().put("$in", lists))))
                .subscribe(result -> {
                    JsonObject listData = new JsonObject();
                    listData.put("items", new JsonArray(result));
                    msg.reply(listData);
                });
    }

    private void createList(Message<JsonObject> msg) {
        mongoClient.rxSave("lists", msg.body()).subscribe(
                id -> {
                    JsonObject newList = msg.body().put("_id", id);
                    msg.reply(newList);
                    DeliveryOptions options = new DeliveryOptions()
                            .addHeader("action", "create-list")
                            .addHeader("for-users", String.valueOf(msg.body().getJsonArray("owners")));
                    vertx.eventBus().publish("sync-queue", newList, options);
                }
        );
    }

    private void updateList(Message<JsonObject> msg) {
        final AtomicReference<JsonArray> listOwners = new AtomicReference<>();
        JsonObject listToUpdate = msg.body();
        String listId = listToUpdate.getString("_id");

        userHasListAccess(listToUpdate.getString("userId"), listId)
                .flatMap(hasAccess -> {
                    listToUpdate.remove("userId");
                    listToUpdate.remove("_id");
                    listOwners.set(hasAccess);
                    return Single.just(listToUpdate).toMaybe();
                })

                .flatMap(list -> mongoClient.rxUpdateCollection("lists", new JsonObject().put("_id", listId), listToUpdate))
                .flatMap(updateResult -> mongoClient.rxFindOne("lists", new JsonObject().put("_id", listId), null))
                .subscribe(result -> {
                    msg.reply(result);
                    DeliveryOptions options = new DeliveryOptions()
                            .addHeader("action", "update-list-data")
                            .addHeader("for-users", String.valueOf(listOwners.get()));
                    vertx.eventBus().publish("sync-queue", result, options);
                });
    }

    private void findLists(Message<JsonObject> msg) {
        mongoClient.rxFind("lists", new JsonObject().put("owners.userId", msg.body().getString("userId"))).subscribe(
                result -> msg.reply(new JsonArray(result)));
    }

    private Maybe<JsonArray> userHasListAccess(String userId, String listId) {
        return mongoClient.rxFindOne("lists", new JsonObject().put("_id", listId), null).map(
                result -> {
                    JsonArray owners = result.getJsonArray("owners", new JsonArray());
                    boolean hasAccess = owners.stream().anyMatch(o -> ((JsonObject) o).getString("userId", "").equals(userId));
                    if (!hasAccess) {
                        throw new RuntimeException("FORBIDDEN");
                    }
                    return owners;
                }
        );
    }

    private Maybe<List<String>> getListOwners(String listId) {
        return mongoClient.rxFindOne("lists", new JsonObject().put("_id", listId), null).map(
                result -> {
                    JsonArray owners = result.getJsonArray("owners", new JsonArray());
                    return owners.stream().map(o -> ((JsonObject) o).getString("userId")).collect(Collectors.toList());
                }
        );
    }

    private void updateListItemOrder(Message<JsonObject> msg) {
        JsonObject sortUpdate = msg.body();
        String userId = sortUpdate.getString("userId");
        String listId = sortUpdate.getString("listId");
        userHasListAccess(userId, listId).subscribe(hasAccess ->
                sortUpdate.getJsonArray("sorting").forEach(sortInfo ->
                        mongoClient.rxUpdateCollection("items",
                                new JsonObject().put("_id", ((JsonObject) sortInfo).getString("_id")),
                                new JsonObject().put("$set",
                                        new JsonObject().put("sortOrder", ((JsonObject) sortInfo).getInteger("sortOrder")))
                        ).subscribe()));
    }

    private void shareList(Message<JsonObject> msg) {
        JsonObject shareList = msg.body();
        String userId = shareList.getString("userId");
        String listId = shareList.getString("listId");
        String userName = shareList.getString("userName");
        String sharedBy = shareList.getString("sharedBy");
        String listName = shareList.getString("listName");
        String encryptedKey = shareList.getString("encryptedKey");
        AtomicReference<String> targetUserId = new AtomicReference<>();
        userHasListAccess(userId, listId)
                .flatMap(hasAccess -> mongoClient.rxFindOne("user", new JsonObject().put("username", userName), new JsonObject().put("_id", 1)))
                .flatMap(user -> {
                    targetUserId.set(user.getString("_id"));
                    return mongoClient.rxUpdateCollection("lists",
                            new JsonObject().put("_id", listId),
                            new JsonObject().put("$push",
                                    new JsonObject().put("owners", new JsonObject()
                                            .put("userId", targetUserId.get())
                                            .put("sharedBy", sharedBy)
                                            .put("listName", listName)
                                            .put("encryptedKey", encryptedKey)
                                    )));
                })
                .subscribe(r -> {
                    DeliveryOptions options = new DeliveryOptions()
                            .addHeader("action", "share-list")
                            .addHeader("for-users", String.valueOf(new JsonArray().add(new JsonObject().put("userId", targetUserId.get()))));
                    vertx.eventBus().publish("sync-queue", new JsonObject().put("listId", listId), options);
                });

    }

    private void confirmShareList(Message<JsonObject> msg) {
        JsonObject shareList = msg.body();
        String userId = shareList.getString("userId");
        String listId = shareList.getString("listId");
        String listKey = shareList.getString("listKey");
        userHasListAccess(userId, listId)
                .flatMap(hasAccess -> mongoClient.rxUpdateCollection("lists",
                        new JsonObject().put("_id", listId).put("owners.userId", userId),
                        new JsonObject().put("$set", new JsonObject()
                                .put("owners.$.key", listKey)
                                .putNull("owners.$.listName")
                                .putNull("owners.$.encryptedKey")
                        )))
                .subscribe();
    }

    @Override
    public void stop() {
        mongoClient.close();
    }

}
