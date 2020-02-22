package de.scytec.abhakeln.sync;

import io.vertx.core.Promise;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.bridge.PermittedOptions;
import io.vertx.ext.web.handler.sockjs.BridgeOptions;
import io.vertx.reactivex.core.AbstractVerticle;
import io.vertx.reactivex.core.eventbus.Message;
import io.vertx.reactivex.ext.web.Router;
import io.vertx.reactivex.ext.web.handler.StaticHandler;
import io.vertx.reactivex.ext.web.handler.sockjs.SockJSHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SyncVerticle extends AbstractVerticle {

    private static final Logger LOGGER = LoggerFactory.getLogger(SyncVerticle.class);

    @Override
    public void start(Promise<Void> promise) throws Exception {
        LOGGER.info("Starting " + this.getClass().getSimpleName());
        vertx.eventBus().consumer("sync-queue", this::onMessage);

        Router router = Router.router(vertx);

        router.route("/eventbus/*").handler(eventBusHandler());
        router.route().handler(staticHandler());

        vertx.createHttpServer()
                .requestHandler(router)
                .listen(8081);

        promise.complete();
    }

    private SockJSHandler eventBusHandler() {
        BridgeOptions options = new BridgeOptions()
                .addOutboundPermitted(new PermittedOptions().setAddressRegex("sync-queue"));
        //.addInboundPermitted(new PermittedOptions().setAddressRegex("sync-queue"));
        SockJSHandler sockJSHandler = SockJSHandler.create(vertx);
        sockJSHandler.bridge(options);
        return sockJSHandler;
    }

    private StaticHandler staticHandler() {
        return StaticHandler.create()
                .setCachingEnabled(false);
    }

    private void onMessage(Message<JsonObject> msg) {
        LOGGER.info(String.valueOf(msg.headers()));
        LOGGER.info(String.valueOf(msg.body()));
    }
}
