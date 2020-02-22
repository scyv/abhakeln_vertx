package de.scytec.abhakeln.notification;

import io.vertx.core.Promise;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.AbstractVerticle;
import io.vertx.reactivex.core.eventbus.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class NotificationVerticle extends AbstractVerticle {

    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationVerticle.class);

    @Override
    public void start(Promise<Void> promise) throws Exception {
        LOGGER.info("Starting " + this.getClass().getSimpleName());


        vertx.eventBus().consumer("notify-queue", this::onMessage);

        promise.complete();
    }

    private void onMessage(Message<JsonObject> msg) {
        LOGGER.info(String.valueOf(msg.body()));
    }

}
