require("dotenv").config() //instatiate environment variables

let DATABASECOFIG = {} //Make this global to use all over the application

DATABASECOFIG.port = process.env.DB_PORT || "3306"
DATABASECOFIG.dialect = process.env.DB_DIALECT || "mysql"
DATABASECOFIG.host = process.env.DB_HOST || "localhost"
DATABASECOFIG.database = process.env.DB_NAME || "name"
DATABASECOFIG.username = process.env.DB_USER
DATABASECOFIG.password = process.env.DB_PASSWORD || ""

module.exports = DATABASECOFIG