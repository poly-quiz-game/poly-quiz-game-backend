const express = require('express');
const init = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

require('../../../database/model/quizzes');
const Quizzes = mongoose.model('Quizzes');

//lấy dự liệu từ db về
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

//add
init.post('/', async function (req, res) {
  const quizzes = await Quizzes(req.body);
  quizzes.save((err, data) => {
    if (err) {
      res.status(400).json({
        error: 'không thêm được dữ liệu',
      });
    }
    res.json(data);
  });
});

//delete api
init.delete('/:id', async function (req, res) {
  let quiz = await Quizzes.findOne({ _id: req.params.id });
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
});

//update
init.put('/:id', async function (req, res) {
  try {
    await Quizzes.updateOne({ _id: req.params.id }, req.body);
    res.json({ smg: '' });
  } catch {
    res.status(400).json({
      error: 'không sửa được dữ liệu',
    });
  }
});

init.get('/:id', async function (req, res) {
  try {
    const quiz = await Quizzes.findOne({ _id: req.params.id });
    res.json({
      data: quiz,
    });
  } catch (error) {
    res.json({
      data: error,
    });
  }
});

module.exports = init;
