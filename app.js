const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const routing = require('./routes');
const databaseConnection = require('./config/modelConfig');
global.moment = require('moment');
global.msgHelper = require('./helper/msg');


// Sync the database
databaseConnection.sequelize.sync().then(() => {
  console.log('Database connection established successfully.')
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});

var app = express();
app.use(cors());

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));
app.locals.baseURL = process.env.BASE_URL;

app.use('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public'));
});

app.use(function (req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  res.locals.messages = "";
  next();
});

app.use(routing);

module.exports = app;