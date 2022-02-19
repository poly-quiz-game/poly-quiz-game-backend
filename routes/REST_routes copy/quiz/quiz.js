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
    const { offset = 0, limit = 10, search, sortBy = '-createdAt' } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    query.user = req.user._id;

    const quizzes = await Quizzes.find(query)
      .skip(Number(offset))
      .limit(Number(limit))
      .sort(sortBy);

    const total = await Quizzes.countDocuments(query);

    res.json({
      quizzes,
      total,
    });
  }
);

init.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      const quiz = await Quizzes.findOne({
        _id: req.params.id,
        user: req.user._id,
      }).populate('reports');
      res.json({
        data: quiz,
      });
    } catch (error) {
      res.json({
        data: error,
      });
    }
  }
);

init.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    const { quiz } = req.body;
    quiz.user = req.user._id;
    const quizzes = await Quizzes(quiz);
    quizzes.save((err, data) => {
      if (err) {
        console.log(err)
        res.status(400).json({
          error: 'không thêm được dữ liệu',
          err,
        });
      }
      res.json(data);
    });
  }
);

init.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    const quiz = await Quizzes.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    quiz.remove((err, deleteItem) => {
      if (err) {
        return res.status(400).json({
          error: 'khong xoa dc san pham',
        });
      }
      res.json({
        deleteItem,
        message: 'xoa thanh cong',
      });
    });
  }
);

init.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      await Quizzes.findOne(
        {
          _id: req.params.id,
          user: req.user._id,
        },
        req.body
      );
      res.json({ smg: '' });
    } catch {
      res.status(400).json({
        error: 'không sửa được dữ liệu',
      });
    }
  }
);

module.exports = init;
