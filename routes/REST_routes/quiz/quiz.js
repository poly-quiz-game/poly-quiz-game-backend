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
        sortField = 'updatedAt',
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
    } catch (error) {
      console.log(error);
      res.status(400).json({
        error: 'error',
      });
    }
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
  async function (req, res, next) {
    try {
      const { quiz } = req.body;
      quiz.userId = req.user.id;

      quiz.questions = await Promise.all(
        quiz.questions.map(async question => {
          const questionType = await prisma.questionType.findFirst({
            where: { name: question?.type?.name },
          });
          if (!questionType || questionType.isActive === false) {
            throw new Error('Question type not found');
          }
          return { ...question, questionTypeId: questionType.id };
        })
      );

      next();
    } catch (error) {
      res.status(400).json(error);
    }
  },

  async function (req, res) {
    try {
      const { quiz } = req.body;
      quiz.userId = req.user.id;

      const quizData = {
        ...quiz,
        questions: {
          create: quiz.questions.map(({ type, questionTypeId, ...q }) => ({
            ...q,
            questionTypeId,
            answers: {
              create: q.answers.map((a, i) => ({ answer: a, index: i })),
            },
          })),
        },
      };
      const createQuiz = await prisma.quiz.create({ data: quizData });
      res.json(createQuiz);
    } catch (error) {
      console.log(error);
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
        },
      });
      if (!quiz || quiz?.userId !== Number(req.user.id)) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      const oldQuestions = quiz.questions;

      const {
        quiz: { questions, ...quizData },
      } = req.body;

      const questionToDelete = oldQuestions.filter(
        oldQuestion =>
          !questions.find(newQuestion => newQuestion.id === oldQuestion.id)
      );

      const updateQuiz = await prisma.quiz.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          ...quizData,
          updatedAt: new Date(),
        },
      });

      const updateQuestion = questions.map(async question => {
        const { type, ...questionData } = question;
        if (question.id) {
          await prisma.question.update({
            where: {
              id: Number(question.id),
            },
            data: {
              ...questionData,
              questionTypeId: type.id,
              answers: {
                update: question.answers.map((answer, i) => ({
                  where: {
                    index_questionId: {
                      questionId: Number(question.id),
                      index: i,
                    },
                  },
                  data: {
                    answer,
                    index: i,
                  },
                })),
              },
            },
          });
        } else {
          await prisma.question.create({
            data: {
              ...questionData,
              quizId: Number(quiz.id),
              questionTypeId: type.id,
              answers: {
                create: question.answers.map((a, i) => ({
                  answer: a,
                  index: i,
                })),
              },
            },
          });
        }
      });

      const deleteQuestions = questionToDelete.map(async question => {
        await prisma.question.delete({
          where: {
            id: Number(question.id),
          },
        });
      });
``
      await Promise.all([...updateQuestion, ...deleteQuestions]);

      res.json(updateQuiz);
    } catch (error) {
      console.log(error);
      res.status(400).json(error);
    }
  }
);

module.exports = init;
