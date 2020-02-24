package de.scytec.abhakeln;

import de.scytec.abhakeln.db.DbConfig;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.auth.mongo.HashAlgorithm;
import io.vertx.ext.bridge.BridgeEventType;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.auth.User;
import io.vertx.reactivex.ext.auth.mongo.MongoAuth;
import io.vertx.reactivex.ext.mongo.MongoClient;
import io.vertx.reactivex.ext.web.RoutingContext;
import io.vertx.reactivex.ext.web.handler.sockjs.BridgeEvent;

import java.util.ArrayList;

public class Authentication {

    private MongoAuth authProvider;

    public Authentication(Vertx vertx, JsonObject config) {
        MongoClient dbClient = MongoClient.createShared(vertx, new DbConfig().get(config));
        JsonObject authProperties = new JsonObject();

        authProvider = MongoAuth.create(dbClient, authProperties);
        authProvider.setHashAlgorithm(HashAlgorithm.PBKDF2);
    }

    public MongoAuth getAuthProvider() {
        return authProvider;
    }

    public void authenticate(RoutingContext context) {
        JsonObject body = context.getBodyAsJson();
        authProvider.rxAuthenticate(
                new JsonObject()
                        .put("username", body.getString("username").toLowerCase())
                        .put("password", body.getString("password")))
                .subscribe(user -> {
                    context.setUser(user);
                    context.session().put("userId", user.principal().getString("userId"));
                    context.response().putHeader("Content-Type", "text/plain").end("OK");
                }, err -> {
                    context.response().setStatusCode(403).end();
                });
    }

    public void authenticate(BridgeEvent be) {
        if (be.type() == BridgeEventType.RECEIVE) {
            User user = be.socket().webUser();

            if (user == null) {
                be.complete(false);
                return;
            }
            String forUsers = be.getRawMessage().getJsonObject("headers", new JsonObject()).getString("for-users");
            if (forUsers == null) {
                be.complete(false);
                return;
            }
            JsonArray users = new JsonArray(forUsers);
            String userId = user.principal().getString("_id");
            if (users.stream().noneMatch(u -> ((JsonObject) u).getString("userId").equals(userId))) {
                be.complete(false);
                return;
            }
        }
        be.complete(true);
    }

    public void register(RoutingContext context) {
        JsonObject body = context.getBodyAsJson();
        authProvider.rxInsertUser(
                body.getString("username").toLowerCase(),
                body.getString("password"),
                new ArrayList<>(),
                new ArrayList<>()
        )
                .subscribe(result -> {
                    authenticate(context);
                }, err -> {
                    context.response().setStatusCode(500).end();
                });
    }


}
