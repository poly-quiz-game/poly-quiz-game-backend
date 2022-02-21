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
    searchField = 'email',
    search: searchValue,
    sortField = 'createdAt',
    sortDirection = 'desc',
  } = req.query;

  const query = {
    orderBy: {
      [sortField]: sortDirection,
    },
    where: {},
  };

  if (searchField && searchValue) {
    query.where[searchField] = {
      contains: searchValue,
    };
  }
  const users = await prisma.user.findMany({
    skip: Number(offset),
    take: Number(limit),
    include: {
      quizzes: true,
      reports: true,
    },
    orderBy: {
      [sortField]: sortDirection,
    },
  });

  const total = await prisma.user.count(query);
  res.json({
    data: users,
    total,
  });
});

init.get('/:id', async function (req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        quizzes: {
          include: {
            questions: true,
          },
        },
        reports: {
          include: {
            reportQuestions: true,
            players: true,
          },
        },
      },
    });
    res.json({
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: 'error',
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
  try {
    const user = req.body;
    const createQuiz = await prisma.user.create({ data: user });
    res.json(createQuiz);
  } catch (error) {
    res.status(400).json({
      error: 'can not create user',
    });
  }
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
