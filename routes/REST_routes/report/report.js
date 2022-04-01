const express = require('express');
const init = express.Router();
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

init.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
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
    } catch (error) {
      console.log(error);
      res.status(400).json({
        error: 'error',
      });
    }
  }
);
// lấy tất cả user trả lời trong 1 report
init.get(
  '/:id/players',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    console.log('ok', req.user.id);
    try {
      const {
        offset = 0,
        limit = 10,
        sortField = 'score',
        sortDirection = 'desc',
      } = req.query;
      const query = {
        orderBy: {
          [sortField]: sortDirection,
        },
        where: {},
      };
      query.where.reportId = { equals: Number(req.params.id) };
      console.log('req.params.id', req.params.id);

      const players = await prisma.player.findMany({
        ...query,
        skip: Number(offset),
        take: Number(limit),
        include: {
          report: {
            include: {
              reportQuestions: {
                include: {
                  reportQuestionAnswers: true,
                },
              },
            },
          },
          playerAnswers: true,
        },
      });
      return res.json(players);
    } catch (error) {
      console.log(error);
      res.status(400).json(error);
    }
  }
);

const SINGLE_CORRECT_ANSWER = 'SINGLE_CORRECT_ANSWER';
const MULTIPLE_CORRECT_ANSWER = 'MULTIPLE_CORRECT_ANSWER';
const TRUE_FALSE_ANSWER = 'TRUE_FALSE_ANSWER';
const TYPE_ANSWER = 'TYPE_ANSWER';

const questionTypeLabels = {
  [SINGLE_CORRECT_ANSWER]: 'Một đáp án',
  [MULTIPLE_CORRECT_ANSWER]: 'Nhiều đáp án',
  [TRUE_FALSE_ANSWER]: 'Đúng sai',
  [TYPE_ANSWER]: 'Nhập câu trả lời',
};
const getTypeQuestion = questionId => {
  switch (questionId) {
    case 1:
      return questionTypeLabels['SINGLE_CORRECT_ANSWER'];
    case 2:
      return questionTypeLabels['MULTIPLE_CORRECT_ANSWER'];
    case 3:
      return questionTypeLabels['TRUE_FALSE_ANSWER'];
    default:
      return questionTypeLabels['TYPE_ANSWER'];
  }
};
// lấy tất cả report trong 1 user
init.get(
  '/:id/players/:playerId',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      const query = {
        where: {},
      };
      query.where.id = { equals: Number(req.params.playerId) };

      const player = await prisma.player.findFirst({
        ...query,
        include: {
          report: {
            include: {
              reportQuestions: {
                include: {
                  reportQuestionAnswers: true,
                },
              },
            },
          },
          playerAnswers: true,
        },
      });
      const getReportQuestion = i =>
        player.report.reportQuestions.filter(q => i.questionId === q.id)[0];
      const result = player.playerAnswers.map((i, index) => {
        return {
          id: index,
          type: getTypeQuestion(+getReportQuestion(i).questionTypeId),
          time: i.time,
          status:
            i.answer === getReportQuestion(i).correctAnswer
              ? 'CORRECT'
              : 'WRONG',
          blockTitle: getReportQuestion(i).question,
          displayText: i.answer.includes('|')
            ? i.answer
                .split('|')
                .map(a => {
                  return getReportQuestion(i).reportQuestionAnswers[+a].answer;
                })
                .join(', ')
            : getReportQuestion(i).reportQuestionAnswers[+i.answer].answer,
        };
      });
      return res.json(result);
    } catch (error) {
      console.log(error);
      res.status(400).json(error);
    }
  }
);

// lấy tất cả câu hỏi trả lời trong 1 report
init.get(
  '/:id/questions',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    console.log('ok---', req.user.id);
    try {
      // const {
      //   offset = 0,
      //   limit = 10,
      //   // sortField = 'score',
      //   // sortDirection = 'desc',
      // } = req.query;
      const query = {
        orderBy: {
          // [sortField]: sortDirection,
        },
        where: {},
      };
      query.where.id = { equals: Number(req.params.id) };
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
          players: {
            include: {
              playerAnswers: true,
            },
          },
        },
      });
      const result = report && report?.reportQuestions;
      return res.json(result);
    } catch (error) {
      console.log(error);
      res.status(400).json(error);
    }
  }
);
// lấy report theo id
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
          players: {
            include: {
              playerAnswers: true,
            },
          },
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
