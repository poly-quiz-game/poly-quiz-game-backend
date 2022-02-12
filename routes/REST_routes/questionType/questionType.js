const express = require('express');
const init = express.Router();
const mongoose = require('mongoose');

require('../../../database/model/questionTypes');
const QuestionType = mongoose.model('QuestionTypes');

init.get('/', async function (req, res) {
  const questionType = await QuestionType.find().sort('-_id');
  res.json({
    data: questionType,
  });
});

init.get('/:id', async function (req, res) {
  try {
    let questionType = await QuestionType.findOne({ _id: req.params.id });
    res.json({
      data: questionType,
    });
  } catch (error) {
    res.json({
      data: null,
    });
  }
});

init.put('/:id', async function (req, res) {

  let questionType = await QuestionType.findOne({ _id: req.params.id });
  questionType.isActive = req.body.isActive;
  questionType.save((err, data) => {
    if (err || !questionType) {
      res.status(400).json({
        error: 'User not found id',
      });
    }
    res.json(data);
  });
});

module.exports = init;
