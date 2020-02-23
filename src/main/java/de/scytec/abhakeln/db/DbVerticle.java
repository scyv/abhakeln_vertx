package de.scytec.abhakeln.db;

import io.reactivex.Maybe;
import io.vertx.core.Promise;
import io.vertx.core.eventbus.DeliveryOptions;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.AbstractVerticle;
import io.vertx.reactivex.core.eventbus.Message;
import io.vertx.reactivex.ext.mongo.MongoClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DbVerticle extends AbstractVerticle {

    private static final Logger LOGGER = LoggerFactory.getLogger(DbVerticle.class);

    private MongoClient mongoClient;

    @Override
    public void start(Promise<Void> promise) throws Exception {
        LOGGER.info("Starting " + this.getClass().getSimpleName());

        mongoClient = MongoClient.createShared(vertx, new DbConfig().get(config()));
        vertx.eventBus().consumer("db-queue", this::onMessage);

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
            case "get-list-data": {
                this.getListData(msg);
                break;
            }
            case "create-list-item":
                this.createListItem(msg);
                break;
            case "update-item-data": {
                this.updateListItem(msg);
            }
        }
    }

    private void updateListItem(Message<JsonObject> msg) {
        JsonObject body = msg.body();
        String itemId = body.getString("itemId");
        String userId = body.getString("userId");
        body.remove("itemId");
        body.remove("userId");

        mongoClient.rxFindOne("items", new JsonObject().put("_id", itemId), null)
                .map(item -> item.getString("listId"))
                .flatMap(listId -> userHasListAccess(userId, listId))
                .flatMap(hasAccess -> mongoClient.rxUpdateCollection("items", new JsonObject().put("_id", itemId), body))
                .flatMap(updateResult -> mongoClient.rxFindOne("items", new JsonObject().put("_id", itemId), null))
                .subscribe(result -> {
                    msg.reply(result);
                    DeliveryOptions options = new DeliveryOptions().addHeader("action", "update-item-data");
                    vertx.eventBus().publish("sync-queue", result, options);
                });
    }

    private void createListItem(Message<JsonObject> msg) {
        JsonObject newItem = msg.body();
        userHasListAccess(newItem.getString("userId"), newItem.getString("listId")).subscribe(hasAccess -> {
            newItem.remove("userId");
            mongoClient.rxSave("items", newItem).subscribe(
                    id -> {
                        msg.reply(newItem.put("_id", id));
                        DeliveryOptions options = new DeliveryOptions().addHeader("action", "create-list-item");
                        vertx.eventBus().publish("sync-queue", newItem, options);
                    }
            );
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

    private void createList(Message<JsonObject> msg) {
        mongoClient.rxSave("lists", msg.body()).subscribe(
                id -> {
                    JsonObject newList = msg.body().put("_id", id);
                    msg.reply(newList);
                    DeliveryOptions options = new DeliveryOptions().addHeader("action", "create-list");
                    vertx.eventBus().publish("sync-queue", newList, options);
                }
        );
    }

    private void findLists(Message<JsonObject> msg) {
        mongoClient.rxFind("lists", new JsonObject().put("owners.userId", msg.body().getString("userId"))).subscribe(
                result -> {
                    msg.reply(new JsonArray(result));
                });
    }

    private Maybe<Boolean> userHasListAccess(String userId, String listId) {
        return mongoClient.rxFindOne("lists", new JsonObject().put("_id", listId), null).map(
                result -> {
                    JsonArray owners = result.getJsonArray("owners", new JsonArray());
                    boolean hasAccess = owners.stream().anyMatch(o -> ((JsonObject) o).getString("userId", "").equals(userId));
                    if (!hasAccess) {
                        throw new RuntimeException("FORBIDDEN");
                    }
                    return hasAccess;
                }
        );
    }

    @Override
    public void stop() throws Exception {
        mongoClient.close();
    }

}
