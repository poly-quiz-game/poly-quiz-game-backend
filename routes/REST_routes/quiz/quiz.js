const express = require('express');
const init = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

require('../../../database/model/quizzes');
const Quizzes = mongoose.model('Quizzes');

require('../../../database/model/questions');
const Questions = mongoose.model('Questions');

init.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    const quizzes = await Quizzes.find().sort('-_id');
    res.json({
      data: quizzes,
    });
  }
);

init.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      let quiz = await Quizzes.findOne({ _id: req.params.id });
      const questions = await Questions.find({ quizId: quiz._id });
      quiz._doc.questions = questions;

      res.json({
        data: quiz,
      });
    } catch (error) {
      res.json({
        data: null,
      });
    }
  }
);

module.exports = init;
