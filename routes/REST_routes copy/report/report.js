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
      searchField,
      searchValue,
      sortField = 'createdAt',
      sortDirection = 'desc',
    } = req.query;

    const query = {
      skip: Number(offset),
      take: Number(limit),
      orderBy: {
        [sortField]: sortDirection,
      },
      where: {},
      include: {
        reportQuestions: true,
      },
    };

    if (searchField && searchValue) {
      query.where[searchField] = {
        contains: [searchValue],
      };
    }

    query.where.userId = { equals: Number(req.user.id) };

    const reports = await prisma.report.findMany(query);
    const total = await prisma.report.count();
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
      let report = await Reports.findOne({ _id: req.params.id });
      res.json({
        data: report,
      });
    } catch (error) {
      console.log(error);
      res.json({
        data: null,
      });
    }
  }
);

module.exports = init;
