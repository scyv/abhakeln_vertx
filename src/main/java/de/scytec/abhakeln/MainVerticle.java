package de.scytec.abhakeln;

import de.scytec.abhakeln.api.WebVerticle;
import de.scytec.abhakeln.db.DbVerticle;
import de.scytec.abhakeln.notification.NotificationVerticle;
import io.reactivex.Single;
import io.vertx.core.Promise;
import io.vertx.core.Vertx;
import io.vertx.reactivex.core.AbstractVerticle;

public class MainVerticle extends AbstractVerticle {

    @Override
    public void start(Promise<Void> promise) throws Exception {

        Single<String> dbVerticleDeployment = vertx.rxDeployVerticle(new DbVerticle());

        dbVerticleDeployment
                .flatMap(id -> vertx.rxDeployVerticle(new WebVerticle()))
                .flatMap(id -> vertx.rxDeployVerticle(new NotificationVerticle()))
                .subscribe(id -> promise.complete(), promise::fail);
    }

    public static void main(String[] args) {
        Vertx vertx = Vertx.vertx();
        vertx.deployVerticle(new MainVerticle());
    }
}
