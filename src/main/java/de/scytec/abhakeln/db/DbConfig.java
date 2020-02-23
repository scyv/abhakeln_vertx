package de.scytec.abhakeln.db;

import io.vertx.core.json.JsonObject;

public class DbConfig {

    public JsonObject get(JsonObject config) {
        String uri = config.getString("mongo_uri");
        if (uri == null) {
            uri = "mongodb://localhost:27017";
        }
        String db = config.getString("mongo_db");
        if (db == null) {
            db = "abhakeln";
        }

        return new JsonObject()
                .put("connection_string", uri)
                .put("db_name", db);
    }

}
