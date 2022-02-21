const express = require('express');
const { body, validationResult } = require('express-validator');
const init = express.Router();
const mongoose = require('mongoose');

require('../../../database/model/timeLimits');
const timeLimit = mongoose.model('timeLimits');

init.get('/', async function (req, res) {
  const time = await timeLimit.find().sort('-_id');
  res.json({
    data: time,
  });
});

init.get('/:id', async function (req, res) {
  try {
    let time = await timeLimit.findOne({ _id: req.params.id });
    res.json({
      data: time,
    });
  } catch (error) {
    res.json({
      data: null,
    });
  }
});

init.delete('/:id', async function (req, res) {
  try {
    let time = await timeLimit.findOne({ _id: req.params.id });
    time.remove();
    res.json({
      data: time,
      error: 'Delete successfully',
    });
  } catch (error) {
    res.json({
      data: null,
      message: 'Delete errors',
    });
  }
});

init.post('/', async function (req, res) {
  const time = await new timeLimit(req.body);
  time.save((err, data) => {
    if (err) {
      return res.status(400).json({
        err: 'Errors add users',
      });
    }
    res.json(data);
  });
});

init.put('/:id', async function (req, res) {
  let time = await timeLimit.findOne({ _id: req.params.id });
  time.name = req.body.name;
  time.time = req.body.time;
  time.save((err, data) => {
    if (err || !time) {
      res.status(400).json({
        error: 'User not found id',
      });
    }
    res.json(data);
  });
});

module.exports = init;
