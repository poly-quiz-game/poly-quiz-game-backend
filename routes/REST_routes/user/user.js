const express = require('express');
const { body, validationResult } = require('express-validator');
const init = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

init.get('/', async function (req, res) {
  try {
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
        [sortField || 'createdAt']: sortDirection,
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
        [sortField || 'createdAt']: sortDirection,
      },
    });

    const total = await prisma.user.count(query);
    res.json({
      data: users,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: 'error',
    });
  }
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

init.post('/', body('email').isEmail(), async function (req, res) {
  try {
    const user = req.body;
    const createUser = await prisma.user.create({ data: user });
    res.json(createUser);
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
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });
    if (!user) {
      return res.status(400).json({
        error: 'User not found',
      });
    }

    const updateUser = await prisma.user.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        ...req.body,
      },
    });
    res.json(updateUser);
  } catch (error) {
    res.status(400).json({
      error: 'can not update user',
    });
  }
});

module.exports = init;
