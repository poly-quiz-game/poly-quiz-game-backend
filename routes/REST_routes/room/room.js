const express = require('express');
const init = express.Router();

const { LiveRooms } = require('../../../utils/liveRooms');
const liveRooms = new LiveRooms();

init.get('/', async function (req, res) {
  const room = liveRooms.getRoom();
  res.json({
    data: room,
  });
});

init.get('/:id', async function (req, res) {
  const room = liveRooms.getRoomByPin(req.params.id);
  console.log('room', liveRooms.getRoom(), req.params.id, room);
  res.json({
    data: room,
  });
});

module.exports = init;
