const express = require('express');
const init = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

require('../../../database/model/quizzes');
const Quizzes = mongoose.model('Quizzes');

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

init.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      const newQuiz = new Quizzes({
        user: req.user._id,
        ...req.body.quiz,
      });
      const response = await newQuiz.save();
      res.json(response);
    } catch (error) {
      res.json({
        data: error,
      });
    }
  }
);

init.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    // console.log(req);
    try {
      let quiz = await Quizzes.findOne({ _id: req.params.id }).populate('user');
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
