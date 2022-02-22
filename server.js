'use strict';
const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
// const expressSwagger = require('express-swagger-generator')(app);
const mongoose = require('mongoose');
const logger = require('morgan');

const config = require('./config');

const {
  CONNECTION_TYPE,
  DB_HOST,
  DB_USERNAME,
  DB_PASSWORD,
  DB_PORT,
  DB_NAME,
  DB_QUERY_PARAMS,
} = config;
const dbAuthString =
  DB_USERNAME && DB_PASSWORD ? `${DB_USERNAME}:${DB_PASSWORD}@` : '';

let httpServer;

/**
 * Configure middleware
 */
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

/**
 * Include all API Routes
 */
app.use('/api', require('./routes/REST_routes/api'));

/**
 * Swagger UI documentation
 */
// if (config.SWAGGER_SETTINGS.enableSwaggerUI)
//   expressSwagger(config.SWAGGER_SETTINGS);

/**
 * Configure http(s)Server
 */
if (config.HTTPS_ENABLED) {
  const privateKey = fs.readFileSync(config.PRIVATE_KEY_PATH, 'utf8');
  const certificate = fs.readFileSync(config.CERTIFICATE_PATH, 'utf8');
  const ca = fs.readFileSync(config.CA_PATH, 'utf8');

  // Create a HTTPS server
  httpServer = https.createServer(
    { key: privateKey, cert: certificate, ca: ca },
    app
  );
} else {
  // Create a HTTP server
  httpServer = http.createServer({}, app);
}

/**
 * Start http server & connect to MongoDB
 */
httpServer.listen(config.PORT || 3000, () => {
  mongoose.connect(
    `${CONNECTION_TYPE}://${dbAuthString}${DB_HOST}:${DB_PORT}/${DB_NAME}${DB_QUERY_PARAMS}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    () => {
      console.log(`Server started on port ${config.PORT || 3000}`);
    }
  );
});

/**
 * Socket.io section
 */
// const io = require('socket.io')(httpServer);
// io.on('connection', function (socket) {
//   console.log(`New connection: ${socket.id}`);
//   socket.on('sendMsg', async data => {
//     console.log(2222, data);
//     socket.emit('sendMsg', 'hihi');
//   });
//   socket.on('disconnect', () => console.log(`Connection left (${socket.id})`));
// });

const io = require('./routes/SOCKET_routes');
io.attach(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
