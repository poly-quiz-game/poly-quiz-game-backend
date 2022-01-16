const express = require('express');
const init = express.Router();
const mongoose = require('mongoose');

require('../../../database/model/quizzes');
const Quizzes = mongoose.model('Quizzes');

require('../../../database/model/questions');
const Questions = mongoose.model('Questions');

init.get('/', async function (req, res) {
  const quizzes = await Quizzes.find().sort('-_id');
  console.log(quizzes);
  res.json({
    data: quizzes,
  });
});

init.get('/:id', async function (req, res) {
  try {
    let quiz = await Quizzes.findOne({ _id: req.params.id });
    console.log(222, quiz);
    const questions = await Questions.find({ quizId: quiz._id });
    console.log(333, questions);
    quiz.questions = questions;
    res.json({
      data: quiz,
    });
  } catch (error) {
    res.json({
      data: null,
    });
  }
});

module.exports = init;
