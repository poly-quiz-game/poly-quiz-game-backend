const express = require('express');
const api = express.Router();

const v1Route = require('./v1/init');
const authRoute = require('./auth/auth');
const quizRoute = require('./quiz/quiz');
const roomRoute = require('./room/room');
const userRoute = require('./user/user');
const questionTypeRoute = require('./questionType/questionType');
const questionTimeRoute = require('./timeLimits/timeLimits');

api.use('/v1', v1Route);
api.use('/auth', authRoute);
api.use('/quiz', quizRoute);
api.use('/room', roomRoute);
api.use('/user', userRoute);
api.use('/question-type', questionTypeRoute);
api.use('/question-time', questionTimeRoute);

module.exports = api;
