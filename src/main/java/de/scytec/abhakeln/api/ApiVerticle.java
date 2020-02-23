package de.scytec.abhakeln.api;

import io.vertx.core.Promise;
import io.vertx.core.eventbus.DeliveryOptions;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.AbstractVerticle;
import io.vertx.reactivex.core.http.HttpServer;
import io.vertx.reactivex.ext.web.Router;
import io.vertx.reactivex.ext.web.RoutingContext;
import io.vertx.reactivex.ext.web.handler.BodyHandler;
import io.vertx.reactivex.ext.web.handler.CorsHandler;
import io.vertx.reactivex.ext.web.handler.ResponseContentTypeHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ApiVerticle extends AbstractVerticle {

    private static final Logger LOGGER = LoggerFactory.getLogger(ApiVerticle.class);

    @Override
    public void start(Promise<Void> promise) throws Exception {
        LOGGER.info("Starting " + this.getClass().getSimpleName());

        Integer apiPort = config().getInteger("API_PORT", 18080);

        Router mainRouter = Router.router(vertx);
        Router apiRouter = Router.router(vertx);
        mainRouter.mountSubRouter("/api", apiRouter);

        apiRouter.route().handler(CorsHandler.create("*")
                .allowedMethod(HttpMethod.POST)
                .allowedMethod(HttpMethod.PUT)
                .allowedMethod(HttpMethod.GET)
                .allowedHeader("Content-Type"));
        apiRouter.route().handler(ResponseContentTypeHandler.create());
        apiRouter.post().handler(BodyHandler.create());
        apiRouter.put().handler(BodyHandler.create());
        apiRouter.get("/lists/").produces("application/json").handler(this::getLists);
        apiRouter.post("/lists/").produces("application/json").handler(this::createList);
        apiRouter.get("/lists/:id/").produces("application/json").handler(this::getListData);
        apiRouter.post("/lists/:id/").produces("application/json").handler(this::createListItem);
        apiRouter.put("/items/:id/").produces("application/json").handler(this::updateListItem);


        HttpServer server = vertx.createHttpServer();
        server.requestHandler(mainRouter)
                .rxListen(apiPort)
                .subscribe();

        promise.complete();
    }

    private void updateListItem(RoutingContext routingContext) {
        String itemId = routingContext.pathParam("id");
        DeliveryOptions options = new DeliveryOptions().addHeader("action", "update-item-data");

        JsonObject json = routingContext.getBodyAsJson();
        JsonObject itemToUpdate = new JsonObject();
        itemToUpdate.put("_id", itemId);
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
                    error.printStackTrace();
                    routingContext.response()
                            .setStatusCode(500).end(error.getMessage());
                });
    }

    private void createList(RoutingContext routingContext) {
        DeliveryOptions options = new DeliveryOptions().addHeader("action", "create-list");
        JsonObject newList = new JsonObject().put("name", routingContext.getBodyAsJson().getString("name"));
        vertx.eventBus().rxRequest("db-queue", newList, options)
                .subscribe(list -> {
                    routingContext.response().end(((JsonObject) list.body()).encodePrettily());
                });
    }

    private void getLists(RoutingContext routingContext) {
        DeliveryOptions options = new DeliveryOptions().addHeader("action", "get-lists");
        vertx.eventBus().rxRequest("db-queue", new JsonObject(), options)
                .subscribe(lists -> {
                    routingContext.response().end(((JsonArray) lists.body()).encodePrettily());
                }, error -> {
                    error.printStackTrace();
                    routingContext.response()
                            .setStatusCode(500).end(error.getMessage());
                });
    }

    private void getListData(RoutingContext routingContext) {
        String listId = routingContext.pathParam("id");
        DeliveryOptions options = new DeliveryOptions().addHeader("action", "get-list-data");
        vertx.eventBus().rxRequest("db-queue", new JsonObject().put("_id", listId), options)
                .subscribe(listData -> {
                    routingContext.response().end(((JsonObject) listData.body()).encodePrettily());
                }, error -> {
                    error.printStackTrace();
                    routingContext.response()
                            .setStatusCode(500).end(error.getMessage());
                });
    }

    private void createListItem(RoutingContext routingContext) {
        String listId = routingContext.pathParam("id");

        DeliveryOptions options = new DeliveryOptions().addHeader("action", "create-list-item");

        JsonObject newItem = new JsonObject();
        JsonObject json = routingContext.getBodyAsJson();
        newItem.put("task", json.getString("task"));
        newItem.put("listId", listId);
        newItem.put("done", false);

        LOGGER.info("creating item" + newItem);

        vertx.eventBus().rxRequest("db-queue", newItem, options)
                .subscribe(list -> {
                    routingContext.response().end(((JsonObject) list.body()).encodePrettily());
                });
    }
}
