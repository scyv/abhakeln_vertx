package de.scytec.abhakeln.api;

import de.scytec.abhakeln.Authentication;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.bridge.PermittedOptions;
import io.vertx.ext.web.handler.sockjs.BridgeOptions;
import io.vertx.reactivex.core.AbstractVerticle;
import io.vertx.reactivex.core.eventbus.Message;
import io.vertx.reactivex.core.http.HttpServer;
import io.vertx.reactivex.ext.web.Router;
import io.vertx.reactivex.ext.web.handler.*;
import io.vertx.reactivex.ext.web.handler.sockjs.SockJSHandler;
import io.vertx.reactivex.ext.web.sstore.LocalSessionStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WebVerticle extends AbstractVerticle {

    private static final Logger LOGGER = LoggerFactory.getLogger(WebVerticle.class);

    @Override
    public void start(Promise<Void> promise) throws Exception {
        LOGGER.info("Starting " + this.getClass().getSimpleName());

        Integer webPort = config().getInteger("WEB_PORT", 18080);
        vertx.eventBus().consumer("sync-queue", this::onMessage);

        Authentication auth = new Authentication(vertx, config());

        Router router = Router.router(vertx);


        router.route().handler(ResponseContentTypeHandler.create());
        router.route().handler(SessionHandler.create(LocalSessionStore.create(vertx)).setAuthProvider(auth.getAuthProvider()));

        router.route().handler(BodyHandler.create());
        router.post("/login/login/").handler(auth::authenticate);
        router.post("/login/register/").handler(auth::register);

        AuthHandler authHandler = RedirectAuthHandler.create(auth.getAuthProvider(), "/login/");
        router.route("/").handler(authHandler);

        Api api = new Api(vertx);
        router.route("/api/*").handler(api::authenticate);
        router.get("/api/lists/").produces("application/json").handler(api::getLists);
        router.post("/api/lists/").produces("application/json").handler(api::createList);
        router.get("/api/lists/:id/").produces("application/json").handler(api::getListData);
        router.post("/api/lists/:id/").produces("application/json").handler(api::createListItem);
        router.put("/api/items/:id/").produces("application/json").handler(api::updateListItem);

        router.route("/eventbus/*").handler(authHandler).handler(eventBusHandler());
        router.route().handler(staticHandler());

        HttpServer server = vertx.createHttpServer();
        server.requestHandler(router)
                .rxListen(webPort)
                .subscribe();

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
                .setCachingEnabled(config().getBoolean("WEB_CACHING_ENABLED", false));
    }

    private void onMessage(Message<JsonObject> msg) {
        LOGGER.info(String.valueOf(msg.headers()));
        LOGGER.info(String.valueOf(msg.body()));
    }
}
