package de.scytec.abhakeln.db;

import io.vertx.core.Promise;
import io.vertx.core.eventbus.DeliveryOptions;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.AbstractVerticle;
import io.vertx.reactivex.core.Vertx;
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

        JsonObject config = Vertx.currentContext().config();

        String uri = config.getString("mongo_uri");
        if (uri == null) {
            uri = "mongodb://localhost:27017";
        }
        String db = config.getString("mongo_db");
        if (db == null) {
            db = "abhakeln";
        }

        JsonObject mongoconfig = new JsonObject()
                .put("connection_string", uri)
                .put("db_name", db);


        mongoClient = MongoClient.createShared(vertx, mongoconfig);
        vertx.eventBus().consumer("db-queue", this::onMessage);
        mongoClient.createCollection("lists", res -> {
            if (res.succeeded()) {
                mongoClient.rxCount("lists", new JsonObject())
                        .filter(count -> count == 0)
                        .subscribe(count -> {
                            JsonObject list1 = new JsonObject()
                                    .put("name", "Haushalt");
                            JsonObject list2 = new JsonObject()
                                    .put("name", "Einkauf");

                            mongoClient.rxSave("lists", list1).subscribe();
                            mongoClient.rxSave("lists", list2).subscribe();

                        });
            }
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
        String itemId = body.getString("_id");
        body.remove("_id");
        LOGGER.info("Updating item: {}, {}", itemId, body);
        mongoClient.rxUpdateCollection("items", new JsonObject().put("_id", itemId), body).subscribe(
                updateResult -> {
                    mongoClient.rxFindOne("items", new JsonObject().put("_id", itemId), null).subscribe(
                            result -> {
                                msg.reply(result);
                                DeliveryOptions options = new DeliveryOptions().addHeader("action", "update-item-data");
                                vertx.eventBus().publish("sync-queue", result, options);
                            }
                    );
                }
        );
    }

    private void createListItem(Message<JsonObject> msg) {
        mongoClient.rxSave("items", msg.body()).subscribe(
                id -> {
                    JsonObject newItem = msg.body().put("_id", id);
                    msg.reply(newItem);
                    DeliveryOptions options = new DeliveryOptions().addHeader("action", "create-list-item");
                    vertx.eventBus().publish("sync-queue", newItem, options);
                }
        );
    }

    private void getListData(Message<JsonObject> msg) {
        mongoClient.rxFind("items", new JsonObject().put("listId", msg.body().getString("_id"))).subscribe(
                result -> {
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
        mongoClient.rxFind("lists", new JsonObject()).subscribe(
                result -> {
                    msg.reply(new JsonArray(result));
                });
    }


    @Override
    public void stop() throws Exception {
        mongoClient.close();
    }

}
