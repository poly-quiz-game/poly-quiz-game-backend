const express = require('express');
const init = express.Router();

const { Games } = require('../../../utils/games');
const games = new Games();

init.get('/', async function (req, res) {
  const room = games.getRoom();
  res.json({
    data: room,
  });
});

init.get('/:id', async function (req, res) {
  const room = games.getRoomByPin(req.params.id);
  console.log('room', games.getRoom(), req.params.id, room);
  res.json({
    data: room,
  });
});

module.exports = init;
