'use strict';
const express = require('express');
const app = express();
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const config = require('./config');

app.use(
  cors({
    // origin: `http://localhost:${config.PORT || 3000}`,
    origin: function (origin, callback) {
      return callback(null, true);
    },
    optionsSuccessStatus: 200,
    credentials: true,
  }),
  session({
    saveUninitialized: true,
    secret: config.SESSION_SECRET,
    resave: true,
  }),
  cookieParser(),
  bodyParser.json({ limit: '50mb' })
);

app.use(logger('dev'));

app.use('/api', require('./routes/REST_routes/api'));

module.exports = app;
