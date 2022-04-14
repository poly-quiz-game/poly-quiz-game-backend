const express = require('express');
const init = express.Router();
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

init.get('/', async function (req, res) {
  try {
    const { start, end } = req.query;
    const countNewQuiz = await prisma.quiz.count({
      where: {
        createdAt: {
          gte: new Date(start),
          lt: new Date(end),
        },
      },
    });

    const countPlayers = await prisma.report.findMany({
      where: {
        createdAt: {
          gte: new Date(start),
          lt: new Date(end),
        },
      },
      include: {
        players: true,
      },
    });

    const arrayCount =
      await prisma.$queryRaw`SELECT Date("createdAt"), count("createdAt") FROM "Report" WHERE "createdAt" > ${new Date(
        start
      )} AND "createdAt" < ${new Date(end)} GROUP BY Date("createdAt")`;

    const TYPE_ANSWER = {
      where: { type: { name: 'TYPE_ANSWER' } },
    };
    const MULTIPLE_CORRECT_ANSWER = {
      where: { type: { name: 'MULTIPLE_CORRECT_ANSWER' } },
    };
    const SINGLE_CORRECT_ANSWER = {
      where: { type: { name: 'SINGLE_CORRECT_ANSWER' } },
    };
    const TRUE_FALSE_ANSWER = {
      where: { type: { name: 'TRUE_FALSE_ANSWER' } },
    };
    const TYPE_ANSWER_COUNT = await prisma.question.count(TYPE_ANSWER);

    const MULTIPLE_CORRECT_ANSWER_COUNT = await prisma.question.count(
      MULTIPLE_CORRECT_ANSWER
    );
    const SINGLE_CORRECT_ANSWER_COUNT = await prisma.question.count(
      SINGLE_CORRECT_ANSWER
    );
    const TRUE_FALSE_ANSWER_COUNT = await prisma.question.count(
      TRUE_FALSE_ANSWER
    );

    res.json({
      data: {
        questionType: {
          TYPE_ANSWER: TYPE_ANSWER_COUNT,
          MULTIPLE_CORRECT_ANSWER: MULTIPLE_CORRECT_ANSWER_COUNT,
          SINGLE_CORRECT_ANSWER: SINGLE_CORRECT_ANSWER_COUNT,
          TRUE_FALSE_ANSWER: TRUE_FALSE_ANSWER_COUNT,
        },
        arrayCount,
        countNewQuiz,
        countPlayers,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: 'error',
    });
  }
});

init.get('/question-count-by-type/:id', async function (req, res) {
  try {
    const { id } = req.params;
    const query = {
      where: { questionTypeId: Number(id) },
    };
    const questionCount = await prisma.question.count(query);
    res.json({
      data: questionCount,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: 'error',
    });
  }
});

init.get('/detail-quiz/:id', async function (req, res) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        questions: {
          orderBy: {
            index: 'asc',
          },
          include: {
            answers: true,
          },
        },
      },
    });
    res.json(quiz);
  } catch (error) {
    res.status(400).json(error);
  }
});

init.get(
  '/user/top/5',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      if (req.user.role !== 'admin') {
        res.status(403).json({ error: 'fobiddem' });
        return;
      }
      const topUser = await prisma.$queryRaw`
        SELECT ROW_NUMBER() OVER (order by count(distinct "Report".id) DESC) AS key, "User".id, "User".name, count(distinct "Report".id) as countReport, count(distinct "Player".id) as countPlayer from "Report"
        left join "User" on "User".id = "Report"."userId"
        left join "Player"  on "Report".id = "Player"."reportId"
        group by "User".id        
        limit 5`;
      res.json({
        topUser,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json(error);
    }
  }
);

module.exports = init;
