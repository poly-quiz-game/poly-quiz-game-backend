const express = require('express');
const api = express.Router();

const v1Route = require('./v1/init');
const authRoute = require('./auth/auth');
const quizRoute = require('./quiz/quiz');
const roomRoute = require('./room/room');
const userRoute = require('./user/user');


api.use('/v1', v1Route);
api.use('/auth', authRoute);
api.use('/quiz', quizRoute);
api.use('/room', roomRoute);
api.use('/user', userRoute);


module.exports = api;
