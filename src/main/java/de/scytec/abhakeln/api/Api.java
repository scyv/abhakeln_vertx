package de.scytec.abhakeln.api;

import io.vertx.core.eventbus.DeliveryOptions;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.web.RoutingContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
            set.put("done", json.getBoolean("done"));
        }
        itemToUpdate.put("$set", set);

        vertx.eventBus().rxRequest("db-queue", itemToUpdate, options)
                .subscribe(item -> {
                    routingContext.response().end(((JsonObject) item.body()).encodePrettily());
                }, error -> {
                    LOGGER.error("Could not update item {}", itemId, error);
                    routingContext.response()
                            .setStatusCode(500).end(error.getMessage());
                });
    }

    public void createList(RoutingContext routingContext) {
        DeliveryOptions options = new DeliveryOptions().addHeader("action", "create-list");
        JsonObject body = routingContext.getBodyAsJson();
        JsonObject newList = new JsonObject()
                .put("owners", new JsonArray().add(new JsonObject().put("userId", getUserId(routingContext))))
                .put("name", body.getString("name"))
                .put("key", body.getString("key"));
        vertx.eventBus().rxRequest("db-queue", newList, options)
                .subscribe(list -> {
                    routingContext.response().end(((JsonObject) list.body()).encodePrettily());
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
            routingContext.response().end(((JsonArray) lists.body()).encodePrettily());
        }, error -> {
            LOGGER.error("Could not retrieve lists", error);
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
                    routingContext.response().end(((JsonObject) listData.body()).encodePrettily());
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
        newItem.put("done", false);

        vertx.eventBus().rxRequest("db-queue", newItem, options)
                .subscribe(list -> {
                    routingContext.response().end(((JsonObject) list.body()).encodePrettily());
                }, error -> {
                    LOGGER.error("Could not create item for list {}", listId, error);
                    routingContext.response()
                            .setStatusCode(500).end(error.getMessage());
                });
    }

    private String getUserId(RoutingContext ctx) {
        return ctx.user().principal().getString("_id");
    }

}
