const express = require('express');
const { body, validationResult } = require('express-validator');
const init = express.Router();
const passport = require('passport');
const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();
// list
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

// detail
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

// update
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

init.get(
  '/profile/user',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      const countQuiz = await prisma.quiz.count({
        where: {
          userId: req.user.id,
        },
      });
      const usetQuestion = await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
        include: {
          quizzes: {
            include: {
              questions: true,
              reports: {
                include: {
                  players: true,
                },
              },
            },
          },
        },
      });
      res.json({
        countQuiz,
        user: usetQuestion,
      });
    } catch (error) {
      res.status(400).json(error);
    }
  }
);

init.get(
  '/user/count',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      const { start, end } = req.query;
      const quizzes = await prisma.quiz.findMany({
        where: {
          userId: req.user.id,
          createdAt: {
            gte: new Date(start),
            lt: new Date(end),
          },
        },
        include: {
          questions: true,
        },
      });

      const arrayCount =
        await prisma.$queryRaw`SELECT Date("createdAt"), count("createdAt") FROM "Report" WHERE "createdAt" > ${new Date(
          start
        )} AND "createdAt" < ${new Date(
          end
        )} AND "quizId" IN (SELECT id FROM "Quiz" where "userId" = ${
          req.user.id
        }) GROUP BY Date("createdAt")`;

      res.json({
        quizzes,
        arrayCount,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json(error);
    }
  }
);

init.get('/list-report-quiz/:id', async function (req, res) {
  try {
    const report = await prisma.report.findMany({
      where: {
        quizId: Number(req.params.id),
      },
      include: {
        players: true,
        reportQuestions: {
          include: {
            playerAnswer: true,
            reportQuestionAnswers: true,
          },
        },
      },
    });
    res.json(report);
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
});

init.get('/detail-report-quiz/:id', async function (req, res) {
  try {
    const reports = await prisma.report.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        players: true,
        reportQuestions: {
          include: {
            playerAnswer: true,
            reportQuestionAnswers: true,
          },
        },
      },
    });
    res.json(reports);
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
});
module.exports = init;
