const express = require('express');
const init = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

require('../../../database/model/reports');
const Reports = mongoose.model('Reports');

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

    const reports = await prisma.report.findMany({
      ...query,
      skip: Number(offset),
      take: Number(limit),
      include: {
        reportQuestions: true,
        players: true,
      },
    });
    const total = await prisma.report.count(query);
    res.json({
      data: reports,
      total,
    });
  }
);

// init.post(
//   '/',
//   passport.authenticate('jwt', { session: false }),
//   async function (req, res) {
//     try {
//       const newQuiz = new Quizzes({
//         user: req.user._id,
//         ...req.body.quiz,
//       });
//       const response = await newQuiz.save();
//       res.json(response);
//     } catch (error) {
//       res.json({
//         data: error,
//       });
//     }
//   }
// );

init.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      const report = await prisma.report.findUnique({
        where: {
          id: Number(req.params.id),
        },
        include: {
          reportQuestions: {
            include: {
              reportQuestionAnswers: true,
            },
          },
          players: true,
        },
      });
      if (report.userId === Number(req.user.id)) {
        res.json(report);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json(error);
    }
  }
);

module.exports = init;
