const { Client, Entity, Schema, Repository } = require('redis-om');

class Player extends Entity {}

let playerSchema = new Schema(
  Player,
  {
    pin: { type: 'string' },
    hostId: { type: 'string' },
    roomLive: { type: 'boolean' },
    roomData: { type: 'string' },
  },
  {
    dataStructure: 'JSON',
  }
);
