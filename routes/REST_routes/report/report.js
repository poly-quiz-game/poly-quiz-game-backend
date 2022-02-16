const express = require('express');
const init = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

require('../../../database/model/reports');
const Reports = mongoose.model('Reports');

init.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    const { offset = 0, limit = 10, search, sortBy = '-createdAt' } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    query.user = req.user._id;

    const reports = await Reports.find(query)
      .skip(Number(offset))
      .limit(Number(limit))
      .sort(sortBy);

    res.json({
      data: reports,
    });
  }
);

// init.post(
//   '/',
//   passport.authenticate('jwt', { session: false }),
//   async function (req, res) {
//     try {
//       const newQuiz = new Quizzes({
//         user: req.user._id,
//         ...req.body.quiz,
//       });
//       const response = await newQuiz.save();
//       res.json(response);
//     } catch (error) {
//       res.json({
//         data: error,
//       });
//     }
//   }
// );

init.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      let report = await Reports.findOne({ _id: req.params.id });
      res.json({
        data: report,
      });
    } catch (error) {
      console.log(error);
      res.json({
        data: null,
      });
    }
  }
);

module.exports = init;
