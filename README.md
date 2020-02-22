# abhakeln-vertx-vue

This is a demo implementation (todo app) using https://vertx.io and https://vuejs.org/

* Message based
* Live Updates (SockJS Event Bridge) for Client
* Mongo Database

## Get running

 * clone repository
 * start a local mongo database (default port: 27017)
 * run ```mvn compile vertx:run```
   * (this will start the app in development mode with automatic verticle redeployment on code change)
 * move your browser to http://localhost:8081/
 * the api is exposed on http://localhost:8080/api/
 
 