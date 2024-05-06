const { Sequelize } = require('sequelize');
require("dotenv").config() //instatiate environment variables
const config = require('../config/config');

const dbName = config.db_name;
const dbUser = config.db_user;
const dbPassword = config.db_password;
const dbHost = config.db_host;
const dbDialect = config.db_dialect


const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: dbDialect,
});

module.exports = sequelize;
