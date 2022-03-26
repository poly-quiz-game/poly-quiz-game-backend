const express = require('express');
const fs = require('fs');
const init = express.Router();

const filePath = './questionTimes.json';

const questionTimeData = require(filePath);

init.get('/', async function (req, res) {
  try {
    res.json({
      data: questionTimeData,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: 'error',
    });
  }
});

init.put('/:id', async function (req, res) {
  try {
    const { id } = req.params;
    const { label, value } = req.body;
    const questionTimes = questionTimeData;

    const questionTime = questionTimes.find(
      questionTime => questionTime.id === Number(id)
    );

    questionTimes.forEach(item => {
      if (item.id === Number(id)) {
        item.label = label;
        item.value = value;
      }
    });
    console.log(questionTimes);
    await fs.writeFile(
      __dirname + '/questionTimes.json',
      JSON.stringify(questionTimes, null, 2),
      function writeJSON(err) {
        if (err) return console.log(err);
        console.log('writing to ' + filePath);
      }
    );
    console.log(questionTime);
    res.json({
      data: questionTime,
    });
  } catch (error) {
    console.log(error);
    res.json({
      data: null,
    });
  }
});

module.exports = init;
