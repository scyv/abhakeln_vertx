# abhakeln-vertx-vue

This is a todo app using https://vertx.io and https://vuejs.org/

* Live Updates (SockJS Event Bridge) for Client
* Client side encryption using XChaCha20-Poly1305 (passwords or clear text are never sent to the server!)
* Message based
* Mongo Database

### Get running

 * clone repository
 * start a local mongo database (default port: 27017)
 * create a database namely ```abhakeln```
 * run ```mvn compile vertx:run```
   * (this will start the app in development mode with automatic verticle redeployment on code change)
 * move your browser to http://localhost:18080/

### Things todo, to get this todo app neat and nice

* ~~Add authentication/authorization~~
* ~~Add client side encryption of contents~~
* Add Wunderlist import
* Add Service Worker (offline mode)
  * Architecture has to be changed to load "all" items (currently only the items of the currently selected list are loaded)
  * Make application "offline first" 
* Add more interaction possibilities for items (comments, attachments)
* Add notifications for items (calendar!)
* Add list sharing, assignment of tasks
* Add possibility for recurrent tasks
* Add virtual lists (today, this week, my-tasks)
* Add smart lists (make suggestions based on historic behavior (If you buy Milk every 5 days, maybe you will also need milk in 5 days?))
* Improve this Readme
* Add further PWA stuff (manifest, icons, app shell, ...)
* Opt: Try, putting the frontend into an electron/cordova container?
* Opt: Make a reusable framework from the sync stuff 


#### "Abhakeln" ???

* See here: https://www.bayrisches-woerterbuch.de/abhackeln/  
 