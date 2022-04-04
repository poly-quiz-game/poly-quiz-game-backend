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
      // truyền vào đáp án đúng
      const getReportQuestion = questionCorrect =>
        report.players.playerAnswers.filter(
          player => questionCorrect.questionId === player.answer
        )[0];
      console.log('getReportQuestion', getReportQuestion);
      const result = report.reportQuestions.map((question, index) => {
        return {
          id: question.id,
          type: getTypeQuestion(+question.questionTypeId),
          question: question.question,
          correct: report.players
            .map(player => {
              // lay ra cau hoi trung voi cau tra loi cua user
              const answer = player.playerAnswers.find(
                a => a.questionId === question.id
              );
              // neu cau tra loi 1 dap an thi so sanh chuoi
              // neu cau tra loi nhieu dap an thi sap xep sau do so sanh chuoi
              return answer.answer.split('|').length > 1
                ? answer.answer
                    .split('|')
                    .sort((a, b) => a > b)
                    .join('') ===
                    question.correctAnswer
                      .split('|')
                      .sort((a, b) => a > b)
                      .join('')
                : answer.answer === question.correctAnswer;
            })
            .filter(i => !!i).length,
          totalReport: report.reportQuestions.length,
        };
      });
      return res.json(result);
    } catch (error) {
      console.log(error);
      res.status(400).json(error);
    }
  }
);

init.get(
  '/:id/questions/:reportId',
  passport.authenticate('jwt', { session: false }),
  async function (req, res) {
    try {
      const query = {
        where: {},
      };
      query.where.id = { equals: Number(req.params.reportId) };

      const question = await prisma.reportQuestion.findFirst({
        ...query,
        include: {
          report: {
            include: {
              players: {
                include: {
                  playerAnswers: {
                    where: {
                      questionId: Number(req.params.reportId),
                    },
                  },
                },
              },
            },
          },
          reportQuestionAnswers: true,
        },
      });
      let result = {};
      if (question.questionTypeId === 2) {
        result = {
          playerAnswers: question.report.players.map(i => ({
            ...i,
            time: i.playerAnswers[0].time,
            answer: i.playerAnswers[0].answer,
            correct:
              i.playerAnswers[0].answer
                .split('|')
                .sort((a, b) => a > b)
                .join('|') === question.correctAnswer,
          })),
          correct: question.correctAnswer
            .split('|')
            .map(i => question.reportQuestionAnswers[i]),
          question: question.question,
          questionTypeId: question.questionTypeId,
          timeLimit: question.timeLimit,
          image: question.image,
        };
      } else {
        result = {
          playerAnswers: question.report.players.map(i => ({
            ...i,
            time: i.playerAnswers[0].time,
            answer:
              question.reportQuestionAnswers[+i.playerAnswers[0].answer].answer,
            correct: i.playerAnswers[0].answer === question.correctAnswer,
          })),
          correct: question.reportQuestionAnswers[+question.correctAnswer],
          question: question.question,
          questionTypeId: question.questionTypeId,
          timeLimit: question.timeLimit,
          image: question.image,
        };
      }

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
