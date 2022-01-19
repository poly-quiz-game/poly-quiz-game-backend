const { Entity, Schema, Repository } = require('redis-om');

const { connect, client } = require('./index');

class LiveRoom extends Entity {}

let liveRoomSchema = new Schema(
  LiveRoom,
  {
    pin: { type: 'string' },
    hostId: { type: 'string' },
    roomLive: { type: 'boolean' },
    roomData: { type: 'string' },
    playersAnswered: { type: 'number' }, // number of player answer question
    questionLive: { type: 'boolean' },
    quizId: { type: 'string' },
    question: { type: 'number' },
  },
  {
    dataStructure: 'JSON',
  }
);

async function createLiveRoom(data) {
  await connect();
  const repository = new Repository(liveRoomSchema, client);

  const room = repository.createEntity(data);
  const id = await repository.save(room);
  return id;
}

module.exports = { createLiveRoom };
