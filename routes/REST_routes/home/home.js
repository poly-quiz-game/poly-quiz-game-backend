const express = require('express');
const init = express.Router();
const passport = require('passport');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

init.get('/', async function (req, res) {
  console.log(123123);
  try {
    const countQuiz = await prisma.quiz.count();
    const countReport = await prisma.report.count();
    const countPlayer = await prisma.player.count();

    res.json({
      data: {
        countQuiz,
        countReport,
        countPlayer,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: 'error',
    });
  }
});

init.get(
  '/detail-quiz/:id',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      if (req.user.role !== 'admin') {
        res.status(403).json({ error: 'fobiddem' });
        return;
      }
      const quiz = await prisma.quiz.findUnique({
        where: {
          id: Number(req.params.id),
        },
        include: {
          questions: {
            include: {
              answers: true,
              type: true,
            },
          },
          reports: {
            include: {
              reportQuestions: true,
              players: {
                include: {
                  playerAnswers: true,
                },
              },
            },
          },
        },
      });
      res.json(quiz);
    } catch (error) {
      res.status(400).json(error);
    }
  }
);

module.exports = init;
