const express = require('express');
const api = express.Router();

const authRoute = require('./auth/auth');
const quizRoute = require('./quiz/quiz');

api.use('/auth', authRoute);
api.use('/quiz', quizRoute);

module.exports = api;
