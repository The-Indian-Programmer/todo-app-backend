// Usage: node scripts/generateModel.js
// This script will generate Sequelize models based on your database schema. You can use this script to generate models for an existing database or to update the models in your project. This script uses the sequelize-auto package to generate the models.


const SequelizeAuto = require('sequelize-auto');
require('dotenv').config();
const databaseConfig = require('../config/databaseConfig');

const path = require('path');
const options = {
  dialect: databaseConfig.dialect,
  host: databaseConfig.host,
  port: databaseConfig.port,
  database: databaseConfig.database,
  username: databaseConfig.username,
  password: databaseConfig.password,
  directory: path.resolve(__dirname, '../models'),
  caseModel: 'c', 
  caseProp: 'c',
  caseFile: 'c', 
  singularize: false,
  additional: {
    timestamps: false,
  },
};
const auto = new SequelizeAuto(null, null, null, options);

auto.run(function (err) {
  if (err) throw err;
  console.log(auto.tables);
});