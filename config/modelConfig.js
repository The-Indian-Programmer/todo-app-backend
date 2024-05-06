const { Sequelize }  = require('sequelize');
const initModels = require('../models/init-models');

const config = require('./databaseConfig');

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect ,
    logging: false
});

const models = initModels(sequelize);

console.log('Database connection established successfully.')

module.exports = { models, sequelize };