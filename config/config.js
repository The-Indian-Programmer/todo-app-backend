require("dotenv").config() //instatiate environment variables

let CONFIG = {} //Make this global to use all over the application

CONFIG.app = process.env.APP || "dev"
CONFIG.port = process.env.PORT || "3000"

CONFIG.db_dialect = process.env.DB_DIALECT || "mysql"
CONFIG.db_host = process.env.DB_HOST || "localhost"
CONFIG.db_port = process.env.DB_PORT || "3306"
CONFIG.db_name = process.env.DB_NAME || "name"
CONFIG.db_user = process.env.DB_USER || "root"
CONFIG.db_password = process.env.DB_PASSWORD || ""

CONFIG.defaultPageLimit = 10
CONFIG.defaultPage = 1
CONFIG.defaultSort = 'id'
CONFIG.defaultSortOrder = 'desc'


module.exports = CONFIG
