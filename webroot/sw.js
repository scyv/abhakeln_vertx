importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

const expireOneDay = new workbox.expiration.ExpirationPlugin({
    maxAgeSeconds: 1 * 24 * 60 * 60,
});


const expire30Days = new workbox.expiration.ExpirationPlugin({
    maxAgeSeconds: 30 * 24 * 60 * 60,
});

workbox.routing.registerRoute(
    /.*\/lib\/.*/,
    new workbox.strategies.CacheFirst({
        cacheName: "3rd-party-cache",
        plugins: [expire30Days]
    })
);

workbox.routing.registerRoute(
    /.*\/icons\/.*/,
    new workbox.strategies.CacheFirst({
        cacheName: "icon-cache",
        plugins: [expireOneDay]
    })
);

workbox.routing.registerRoute(
    /\/login\/.*$/,
    new workbox.strategies.NetworkOnly()
);

workbox.routing.registerRoute(
    /\/[^\/]*(?:css|js|html|json)$/,
    new workbox.strategies.CacheFirst({
        cacheName: "app-cache",
        plugins: [expireOneDay]
    })
);

workbox.routing.registerRoute(
    "/",
    new workbox.strategies.CacheFirst({
        cacheName: "app-cache",
        plugins: [
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [200],
            }),
            expireOneDay
        ]
    })
);

workbox.routing.registerRoute(
    // Cache image files.
    /\.(?:png|jpg|jpeg|svg|gif)$/,
    // Use the cache if it's available.
    new workbox.strategies.CacheFirst({
        // Use a custom cache name.
        cacheName: 'image-cache',
        plugins: [expire30Days],
    })
);

const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('updateQueue', {
    maxRetentionTime: 24 * 60, // Retry for max of 24 Hours (specified in minutes),
    onSync: (ev) => {
        ev.queue.replayRequests().then(() => {
            console.debug("Back online. Requests are resent");
        });
    }
});

workbox.routing.registerRoute(
    /\/api\/.*/,
    new workbox.strategies.NetworkOnly({
        plugins: [bgSyncPlugin]
    }),
    'POST'
);

workbox.routing.registerRoute(
    /\/api\/.*/,
    new workbox.strategies.NetworkOnly({
        plugins: [bgSyncPlugin]
    }),
    'PUT'
);

workbox.routing.registerRoute(
    /\/api\/.*/,
    new workbox.strategies.NetworkFirst({
        networkTimeoutSeconds: 3,
        cacheName: "api-cache",
    }),
    'GET'
);

