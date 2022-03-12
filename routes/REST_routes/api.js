const express = require('express');
const api = express.Router();

const authRoute = require('./auth/auth');
const quizRoute = require('./quiz/quiz');
const userRoute = require('./user/user');
const questionTypeRoute = require('./questionType/questionType');
const questionTimeRoute = require('./timeLimits/timeLimits');
const report = require('./report/report');
const image = require('./image/image');
const dashboard = require('./dashboard/dashboard');

api.use('/auth', authRoute);
api.use('/quiz', quizRoute);
api.use('/user', userRoute);
api.use('/questionType', questionTypeRoute);
// api.use('/question-time', questionTimeRoute);
api.use('/report', report);
api.use('/image', image);
api.use('/dashboard', dashboard);

module.exports = api;
