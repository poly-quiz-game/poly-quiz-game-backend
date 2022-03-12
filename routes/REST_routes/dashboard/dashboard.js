const express = require('express');
const init = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

init.get('/', async function (req, res) {
  try {
    const { start, end } = req.query;

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
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: 'error',
    });
  }
});

module.exports = init;