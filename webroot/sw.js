importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

workbox.routing.registerRoute(
    /.*\/lib\/.*/,
    new workbox.strategies.CacheFirst()
);

workbox.routing.registerRoute(
    /.*\/icons\/.*/,
    new workbox.strategies.CacheFirst()
);


workbox.routing.registerRoute(
    /\/js[^\/]*js$/,
    new workbox.strategies.StaleWhileRevalidate()
);

workbox.routing.registerRoute(
    /\/css[^\/]*css$/,
    new workbox.strategies.StaleWhileRevalidate()
);

workbox.routing.registerRoute(
    /\/login\/.*$/,
    new workbox.strategies.StaleWhileRevalidate()
);

workbox.routing.registerRoute(
    /\/[^\/]*(css|js|html|json)$/,
    new workbox.strategies.StaleWhileRevalidate()
);

workbox.routing.registerRoute(
    /\/$/,
    new workbox.strategies.StaleWhileRevalidate()
);


workbox.routing.registerRoute(
    // Cache image files.
    /\.(?:png|jpg|jpeg|svg|gif)$/,
    // Use the cache if it's available.
    new workbox.strategies.CacheFirst({
        // Use a custom cache name.
        cacheName: 'image-cache',
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                // Cache only 20 images.
                maxEntries: 20,
                // Cache for a maximum of a week.
                maxAgeSeconds: 7 * 24 * 60 * 60,
            })
        ],
    })
);

const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('noteUpdateQueue', {
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
    new workbox.strategies.NetworkFirst(),
    'GET'
);

