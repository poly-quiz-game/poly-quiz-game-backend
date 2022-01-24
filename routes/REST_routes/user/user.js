const express = require('express');
const init = express.Router();
const mongoose = require('mongoose');

require('../../../database/model/users');
const Users = mongoose.model('Users');

init.get('/', async function (req, res) {
  const users = await Users.find().sort('-_id');
  res.json({
    data: users,
  });
});

init.get('/:id', async function (req, res) {
  try {
    let user = await Users.findOne({ _id: req.params.id });
    res.json({
      data: user,
    });
  } catch (error) {
    res.json({
      data: null,
    });
  }
});

init.delete('/:id', async function (req, res) {
  try {
    let user = await Users.findOne({ _id: req.params.id });
    user.remove();
    res.json({
      data: user,
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
  const user = await new Users(req.body);
  user.save((err, data) => {
    if (err) {
      return res.status(400).json({
        err: 'Errors add users',
      });
    }
    res.json(data);
  });
});

init.put('/:id',async function (req, res) {
  let user = await Users.findOne({ _id: req.params.id });
   user.name = req.body.name;
  user.save((err, data) => {
    if (err || !user) {
      res.status(400).json({
        error: 'User not found id',
      });
    }
    res.json(data);
  });
});

module.exports = init;
