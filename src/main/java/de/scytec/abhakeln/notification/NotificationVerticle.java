package de.scytec.abhakeln.notification;

import io.vertx.core.Promise;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.AbstractVerticle;
import io.vertx.reactivex.core.eventbus.Message;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.jose4j.lang.JoseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.Security;

public class NotificationVerticle extends AbstractVerticle {

    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationVerticle.class);

    @Override
    public void start(Promise<Void> promise) {
        LOGGER.info("Starting " + this.getClass().getSimpleName());
        vertx.eventBus().consumer("notify-queue", this::onMessage);
        Security.addProvider(new BouncyCastleProvider());


        promise.complete();
    }

    private void onMessage(Message<JsonObject> msg) {
        sendPush(msg.body());
    }

    private void sendPush(JsonObject msg)  {
        try {
            PushService pushService = new PushService();
            JsonObject subscription = msg.getJsonObject("subscription");
            JsonObject keys = subscription.getJsonObject("keys");
            String endpoint = subscription.getString("endpoint");
            String clientAuth = keys.getString("auth");
            String clientPubkey = keys.getString("p256dh");
            Notification notification = new Notification(new Subscription(endpoint, new Subscription.Keys(clientPubkey, clientAuth)), msg.getJsonObject("payload").encode());
            pushService.sendAsync(notification);
        } catch(GeneralSecurityException | IOException | JoseException ex) {
            LOGGER.error("Could not send push.", ex);
        }
    }

}
