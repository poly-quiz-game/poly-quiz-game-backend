const express = require('express');
const { body, validationResult } = require('express-validator');
const init = express.Router();
const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

require('../../../database/model/users');
const Users = mongoose.model('Users');

init.get('/', async function (req, res) {
  const {
    offset = 0,
    limit = 10,
    search,
    sortField = 'createdAt',
    sortDirection = 'desc',
  } = req.query;

  const users = await prisma.user.findMany({
    skip: offset,
    take: limit,
    include: {
      quizzes: true,
    },
    orderBy: {
      [sortField]: sortDirection,
    },
  });
  res.json({
    users,
  });
});

init.get('/:id', async function (req, res) {
  try {
    let user = await Users.findOne({ _id: req.params.id })
      .populate({ path: 'quizzes' })
      .populate({ path: 'reports' });
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

init.post('/', body('email').isEmail(), async function (req, res) {
  const user = await new Users(req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty() && errors.errors[0].param === 'email') {
    return res.status(400).json('Invalid email address. Please try again.');
  }
  user.save((err, data) => {
    if (err) {
      return res.status(400).json({
        err: 'Errors add users',
      });
    }
    res.json(data);
  });
});

init.put('/:id', body('email').isEmail(), async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty() && errors.errors[0].param === 'email') {
    return res.status(400).json('Invalid email address. Please try again.');
  }
  let user = await Users.findOne({ _id: req.params.id });
  user.isActive = req.body.isActive;
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
