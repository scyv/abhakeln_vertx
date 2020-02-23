package de.scytec.abhakeln;

import de.scytec.abhakeln.db.DbConfig;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.auth.mongo.MongoAuth;
import io.vertx.reactivex.ext.mongo.MongoClient;
import io.vertx.reactivex.ext.web.RoutingContext;

import java.util.ArrayList;

public class Authentication {

    private MongoAuth authProvider;

    public Authentication(Vertx vertx, JsonObject config) {
        MongoClient dbClient = MongoClient.createShared(vertx, new DbConfig().get(config));
        JsonObject authProperties = new JsonObject();
        authProvider = MongoAuth.create(dbClient, authProperties);
    }

    public MongoAuth getAuthProvider() {
        return authProvider;
    }

    public void authenticate(RoutingContext context) {
        JsonObject body = context.getBodyAsJson();
        authProvider.rxAuthenticate(new JsonObject().put("username", body.getString("username")).put("password", body.getString("password")))
                .subscribe(u -> {
                    context.setUser(u);
                    context.response().putHeader("Content-Type", "text/plain").end("OK");
                }, err -> {
                    context.response().setStatusCode(403).end();
                });
    }

    public void register(RoutingContext context) {
        JsonObject body = context.getBodyAsJson();
        authProvider.rxInsertUser(body.getString("username"), body.getString("password"), new ArrayList<>(), new ArrayList<>()).subscribe();
        context.response().putHeader("Content-Type", "text/plain").end("OK");
    }

}
