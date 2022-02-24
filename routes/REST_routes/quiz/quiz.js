const express = require('express');
const init = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

require('../../../database/model/quizzes');
const Quizzes = mongoose.model('Quizzes');

init.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    const {
      offset = 0,
      limit = 10,
      searchField = 'name',
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

    query.where.userId = { equals: Number(req.user.id) };

    const quizzes = await prisma.quiz.findMany({
      ...query,
      skip: Number(offset),
      take: Number(limit),

      include: {
        questions: true,
        reports: true,
      },
    });
    const total = await prisma.quiz.count(query);
    res.json({
      data: quizzes,
      total,
    });
  }
);

init.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      const quiz = await prisma.quiz.findUnique({
        where: {
          id: Number(req.params.id),
        },
        include: {
          questions: {
            include: {
              answers: true,
            },
          },
          reports: true,
        },
      });
      if (quiz.userId === Number(req.user.id)) {
        res.json(quiz);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (error) {
      res.status(400).json(error);
    }
  }
);

init.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      const { quiz } = req.body;
      quiz.userId = req.user.id;

      const quizData = {
        ...quiz,
        questions: {
          create: quiz.questions.map(q => ({
            ...q,
            answers: {
              create: q.answers.map((a, i) => ({ answer: a, index: i })),
            },
          })),
        },
      };
      const createQuiz = await prisma.quiz.create({ data: quizData });
      res.json(createQuiz);
    } catch (error) {
      res.status(400).json(error);
    }
  }
);

init.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      const quiz = await prisma.quiz.findUnique({
        where: {
          id: Number(req.params.id),
        },
      });
      if (!quiz || quiz?.userId !== Number(req.user.id)) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      await prisma.$queryRaw`DELETE FROM public."Answer" A WHERE A."questionId" IN (SELECT QT.id FROM public."Question" QT JOIN public."Quiz" Q ON Q.id = QT."quizId" WHERE Q.id = ${quiz.id})`;

      await prisma.question.deleteMany({
        where: {
          quizId: Number(quiz.id),
        },
      });

      await prisma.quiz.delete({
        where: {
          id: Number(req.params.id),
        },
      });
      res.json({
        message: 'Deleted Successfully',
      });
    } catch (error) {
      res.status(400).json(error);
    }
  }
);

init.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      await Quizzes.findOne(
        {
          _id: req.params.id,
          user: req.user._id,
        },
        req.body
      );
      res.json({ smg: '' });
    } catch (error) {
      res.status(400).json(error);
    }
  }
);

module.exports = init;
