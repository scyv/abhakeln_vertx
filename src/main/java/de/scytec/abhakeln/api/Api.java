package de.scytec.abhakeln.api;

import io.vertx.core.eventbus.DeliveryOptions;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.web.RoutingContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.ZonedDateTime;

public class Api {

    private static final Logger LOGGER = LoggerFactory.getLogger(Api.class);
    private Vertx vertx;

    public Api(Vertx vertx) {
        this.vertx = vertx;
    }

    public void authenticate(RoutingContext routingContext) {
        if (routingContext.request().method() != HttpMethod.OPTIONS) {
            if (routingContext.user() == null) {
                routingContext.response().setStatusCode(403).end("FORBIDDEN");
            } else {
                routingContext.next();
            }
        }
    }

    public void updateListItem(RoutingContext routingContext) {
        String itemId = routingContext.pathParam("id");
        DeliveryOptions options = new DeliveryOptions().addHeader("action", "update-item-data");

        JsonObject json = routingContext.getBodyAsJson();
        JsonObject itemToUpdate = new JsonObject();
        itemToUpdate.put("userId", getUserId(routingContext));
        itemToUpdate.put("itemId", itemId);
        JsonObject set = new JsonObject();
        if (json.containsKey("task")) {
            set.put("task", json.getString("task"));
        }
        if (json.containsKey("done")) {
            boolean isDone = json.getBoolean("done");
            set.put("done", isDone);
            if (isDone) {
                set.put("completedAt", ZonedDateTime.now().toString());
            }
        }
        if (json.containsKey("notes")) {
            set.put("notes", json.getString("notes"));
        }
        if (json.containsKey("dueDate")) {
            set.put("dueDate", json.getString("dueDate"));
        }
        if (json.containsKey("reminder")) {
            set.put("reminder", json.getString("reminder"));
        }
        itemToUpdate.put("$set", set);

        vertx.eventBus().rxRequest("db-queue", itemToUpdate, options)
                .subscribe(item -> {
                    routingContext.response().end(((JsonObject) item.body()).encode());
                }, error -> {
                    LOGGER.error("Could not update item {}", itemId, error);
                    routingContext.response()
                            .setStatusCode(500).end(error.getMessage());
                });
    }

    public void createList(RoutingContext routingContext) {
        DeliveryOptions options = new DeliveryOptions().addHeader("action", "create-list");
        JsonObject json = routingContext.getBodyAsJson();
        JsonObject newList = new JsonObject()
                .put("owners", new JsonArray().add(new JsonObject()
                        .put("userId", getUserId(routingContext))
                        .put("key", json.getString("key"))))
                .put("name", json.getString("name"))
                .put("folder", json.getString("folder", ""));

        if (json.containsKey("importId")) {
            newList.put("importId", json.getInteger("importId"));
        }

        vertx.eventBus().rxRequest("db-queue", newList, options)
                .subscribe(list -> {
                    routingContext.response().end(((JsonObject) list.body()).encode());
                }, error -> {
                    LOGGER.error("Could not create list", error);
                    routingContext.response()
                            .setStatusCode(500).end(error.getMessage());
                });
    }

    public void getLists(RoutingContext routingContext) {
        DeliveryOptions options = new DeliveryOptions().addHeader("action", "get-lists");
        vertx.eventBus().rxRequest("db-queue",
                new JsonObject().put("userId", getUserId(routingContext)),
                options
        ).subscribe(lists -> {
            routingContext.response().end(((JsonArray) lists.body()).encode());
        }, error -> {
            LOGGER.error("Could not retrieve lists", error);
            routingContext.response()
                    .setStatusCode(500).end(error.getMessage());
        });
    }

    public void getAllItems(RoutingContext routingContext) {
        DeliveryOptions options = new DeliveryOptions().addHeader("action", "get-all-items");
        vertx.eventBus().rxRequest("db-queue",
                new JsonObject().put("userId", getUserId(routingContext)), options)
                .subscribe(listData -> {
                    routingContext.response().end(((JsonObject) listData.body()).encode());
                }, error -> {
                    LOGGER.error("Could not retrieve items", error);
                    routingContext.response()
                            .setStatusCode(500).end(error.getMessage());
                });
    }

    public void getListData(RoutingContext routingContext) {
        String listId = routingContext.pathParam("id");
        DeliveryOptions options = new DeliveryOptions().addHeader("action", "get-list-data");
        vertx.eventBus().rxRequest("db-queue",
                new JsonObject().put("userId", getUserId(routingContext)).put("listId", listId), options)
                .subscribe(listData -> {
                    routingContext.response().end(((JsonObject) listData.body()).encode());
                }, error -> {
                    LOGGER.error("Could not retrieve list data for list {}", listId, error);
                    routingContext.response()
                            .setStatusCode(500).end(error.getMessage());
                });
    }

    public void createListItem(RoutingContext routingContext) {
        String listId = routingContext.pathParam("id");

        DeliveryOptions options = new DeliveryOptions().addHeader("action", "create-list-item");

        JsonObject newItem = new JsonObject();
        JsonObject json = routingContext.getBodyAsJson();
        newItem.put("userId", getUserId(routingContext));
        newItem.put("task", json.getString("task"));
        newItem.put("listId", listId);
        newItem.put("done", json.getBoolean("done", false));
        newItem.put("notes", json.getString("notes", ""));
        newItem.put("createdAt", json.getString("createdAt", ZonedDateTime.now().toString()));
        newItem.put("completedAt", json.getString("completedAt", ""));
        newItem.put("dueDate", json.getString("dueDate", ""));
        newItem.put("reminder", json.getString("reminder", ""));
        if (json.containsKey("importId")) {
            newItem.put("importId", json.getInteger("importId"));
        }

        vertx.eventBus().rxRequest("db-queue", newItem, options)
                .subscribe(list -> {
                    routingContext.response().end(((JsonObject) list.body()).encode());
                }, error -> {
                    LOGGER.error("Could not create item for list {}", listId, error);
                    routingContext.response()
                            .setStatusCode(500).end(error.getMessage());
                });
    }

    public void updateList(RoutingContext routingContext) {
        String listId = routingContext.pathParam("id");
        JsonObject updateList = new JsonObject();
        updateList.put("userId", getUserId(routingContext));
        updateList.put("_id", listId);
        JsonObject json = routingContext.getBodyAsJson();
        if (json.containsKey("sorting")) {
            DeliveryOptions options = new DeliveryOptions().addHeader("action", "update-list-itemorder");
            updateList.put("sorting", json.getJsonArray("sorting"));
            vertx.eventBus().send("db-queue", updateList, options);
        } else {
            DeliveryOptions options = new DeliveryOptions().addHeader("action", "update-list-data");
            JsonObject set = new JsonObject();
            if (json.containsKey("name")) {
                set.put("name", json.getString("name"));
            }
            updateList.put("$set", set);

            vertx.eventBus().send("db-queue", updateList, options);
        }
        routingContext.response().end();
    }

    public void shareList(RoutingContext routingContext) {
        String listId = routingContext.pathParam("listId");
        DeliveryOptions options = new DeliveryOptions().addHeader("action", "share-list");
        JsonObject shareList = new JsonObject();
        JsonObject json = routingContext.getBodyAsJson();
        shareList.put("userId", getUserId(routingContext));
        shareList.put("userName", json.getString("userName"));
        shareList.put("listName", json.getString("listName"));
        shareList.put("sharedBy", routingContext.user().principal().getString("username"));
        shareList.put("encryptedKey", json.getString("encryptedKey"));
        shareList.put("listId", listId);

        vertx.eventBus().send("db-queue", shareList, options);
        routingContext.response().end();
    }

    public void confirmShareList(RoutingContext routingContext) {
        String listId = routingContext.pathParam("listId");
        DeliveryOptions options = new DeliveryOptions().addHeader("action", "confirm-share-list");
        JsonObject shareList = new JsonObject();
        JsonObject json = routingContext.getBodyAsJson();
        shareList.put("userId", getUserId(routingContext));
        shareList.put("listId", listId);
        shareList.put("listKey", json.getString("listKey"));

        vertx.eventBus().send("db-queue", shareList, options);
        routingContext.response().end();
    }

    private String getUserId(RoutingContext ctx) {
        return ctx.user().principal().getString("_id");
    }

}
