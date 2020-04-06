# abhakeln

This is a todo app using https://vertx.io and https://vuejs.org/

* Live Updates (SockJS Event Bridge) for Client
* Client side encryption using XChaCha20-Poly1305 (passwords or clear text are never sent to the server!)
* Message based
* Mongo DB
* Progressive Web App

### Get running

 * clone repository
 * start a local mongo database (default port: 27017)
 * run ```mvn compile vertx:run```
   * (this will start the app in development mode with automatic verticle redeployment on code change)
 * open http://localhost:18080/ in your preferred browser

### Things todo, to get this todo app neat and nice

* ~~Add authentication/authorization~~
* ~~Add client side encryption of contents~~
* ~~Add Wunderlist import~~
* ~~Add list sharing~~
* Add Service Worker (offline mode)
* Add notifications for items (calendar!)
* Add assignment of tasks
* Add more interaction possibilities for items (comments, attachments)
* Add possibility for recurrent tasks
* Add further PWA stuff (manifest, icons, app shell, ...)
* Add virtual lists (today, this week, my-tasks)
* Add smart lists (make suggestions based on historic behavior (If you buy Milk every 5 days, maybe you will also need milk in 5 days?))
* Improve this Readme
* Opt: Try, putting the frontend into an electron/cordova container?
* Opt: Make a reusable framework from the sync stuff

### Hints

* This app is in heavy development 
* Currently I'am intentionally not using any build tool for combining/transpiling/dependency management
  * I preferred to make a step back and see what is possible
  * How much does it hurt?
  * This is evaluated during development

#### "Abhakeln" ???

* See here: https://www.bayrisches-woerterbuch.de/abhackeln/  
 
