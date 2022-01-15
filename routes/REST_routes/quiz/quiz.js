const express = require('express');
const init = express.Router();
const mongoose = require('mongoose');

require('../../../database/model/quizzes');
const Quizzes = mongoose.model('Quizzes');

require('../../../database/model/questions');
const Questions = mongoose.model('Questions');

init.get('/', async function (req, res) {
  const quizzes = await Quizzes.find();

  res.json({
    data: quizzes,
  });
});

init.get('/:id', async function (req, res) {
  let quiz = await Quizzes.findOne({ _id: req.params.id });
  const questions = await Questions.find({ quizId: quiz._id });
  quiz.questions = questions;
  res.json({
    data: quiz,
  });
});

module.exports = init;
