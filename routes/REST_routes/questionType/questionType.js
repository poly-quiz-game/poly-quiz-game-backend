const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const init = express.Router();

init.get('/', async function (req, res) {
  try {
    const questionTypes = await prisma.questionType.findMany();

    res.json({
      data: questionTypes,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: 'error',
    });
  }
});

init.get('/:id', async function (req, res) {
  try {
    const questionType = await prisma.questionType.findUnique({
      where: { id: req.params.id },
    });
    if (!questionType) {
      res.status(404).json({
        message: 'Question type not found',
      });
      return;
    }
    res.json({
      data: questionType,
    });
  } catch (error) {
    res.json({
      data: null,
    });
  }
});

init.put('/:id', async function (req, res) {
  try {
    const { isActive } = req.body;
    // if (!isActive) {
    //   await prisma.question.deleteMany({
    //     where: {
    //       questionTypeId: req.params.id,
    //     },
    //   });
    // }
    const questionType = await prisma.questionType.update({
      where: { id: Number(req.params.id) },
      data: {
        isActive,
      },
    });
    console.log(questionType);
    if (!questionType) {
      res.status(404).json({
        message: 'Question type not found',
      });
      return;
    }
    res.json({
      data: questionType,
    });
  } catch (error) {
    console.log(error);
    res.json({
      data: null,
    });
  }
});

module.exports = init;
