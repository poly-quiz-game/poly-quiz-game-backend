const io = require('socket.io')();
const mongoose = require('mongoose');

require('../../database/model/quizzes');
const Quizzes = mongoose.model('Quizzes');

require('../../database/model/questions');
const Questions = mongoose.model('Questions');

const { LiveRooms } = require('../../utils/liveRooms');
const liveRooms = new LiveRooms();

const { Players } = require('../../utils/players');
const players = new Players();

io.on('connection', socket => {
  // console.log('ON', new Date());
  //When host connects for the first time
  socket.on('host-join', async data => {
    const quiz = await Quizzes.findOne({ _id: data.id });
    if (!quiz) {
      return socket.emit('noRoomFound');
    }

    //A Quiz was found with the id passed in url
    const roomPin = Math.floor(Math.random() * 90000) + 10000; //new pin for room

    liveRooms.addRoom(roomPin, socket.id, false, {
      playersAnswered: 0,
      questionLive: false,
      quizId: data.id,
      question: 1,
    }); //Creates a room with pin and host id

    const room = liveRooms.getRoom(socket.id); // Gets the room data

    socket.join(room.pin); //The host is joining a room based on the pin

    // console.log('Room Created with pin:', room.pin);

    //Sending room pin to host so they can display it for players to join
    socket.emit('showRoomPin', {
      pin: room.pin,
      room,
    });
  });

  //When the host connects from the room view
  socket.on('host-join-room', async data => {
    const oldHostId = data.id;
    const room = liveRooms.getRoom(oldHostId); //Gets room with old host id
    if (room) {
      room.hostId = socket.id; //Changes the room host id to new host id
      socket.join(room.pin);
      const playerData = players.getPlayers(oldHostId); //Gets player in room
      for (let i = 0; i < Object.keys(players.players).length; i++) {
        if (players.players[i].hostId == oldHostId) {
          players.players[i].hostId = socket.id;
        }
      }
      const quizId = room.roomData.quizId;

      const quiz = await Quizzes.findOne({ _id: quizId });
      if (!quiz) {
        return socket.emit('noRoomFound'); //No room was found, redirect user
      }

      const questions = await Questions.find({ quizId: quizId });

      const question = questions[0].question;
      const answer1 = questions[0].answers[0];
      const answer2 = questions[0].answers[1];
      const answer3 = questions[0].answers[2];
      const answer4 = questions[0].answers[3];
      const correctAnswer = questions[0].correctAnswer;

      socket.emit('roomQuestions', {
        q1: question,
        a1: answer1,
        a2: answer2,
        a3: answer3,
        a4: answer4,
        correct: correctAnswer,
        playersInRoom: playerData.length,
      });

      io.to(room.pin).emit('gameStartedPlayer');
      room.roomData.questionLive = true;
    } else {
      socket.emit('noRoomFound'); //No room was found, redirect user
    }
  });

  //When player connects for the first time
  socket.on('player-join', params => {
    let roomFound = false; //If a room is found with pin provided by player

    //For each room in the Rooms class
    for (let i = 0; i < liveRooms.rooms.length; i++) {
      //If the pin is equal to one of the room's pin
      if (params.pin == liveRooms.rooms[i].pin) {
        console.log('Player connected to room');

        const hostId = liveRooms.rooms[i].hostId; //Get the id of host of room

        // check is existed player
        if (players.getPlayer(socket.id)) {
          return io
            .to(params.pin)
            .emit('playerJoined', players.getPlayer(socket.id)); //Sending host player data to display
        }

        const player = players.addPlayer(hostId, socket.id, params.name, {
          score: 0,
          answer: 0,
        }); //add player to room

        socket.join(params.pin); //Player is joining room based on pin

        const playersInRoom = players.getPlayers(hostId); //Getting all players in room

        io.to(params.pin).emit('updatePlayerLobby', playersInRoom); //Sending host player data to display

        io.to(params.pin).emit('playerJoined', player); //Sending host player data to display
        roomFound = true; //Room has been found
      }
    }

    //If the room has not been found
    if (roomFound == false) {
      console.log('noRoomFound1: ', params);
      socket.emit('noRoomFound'); //Player is sent back to 'join' page because room was not found with pin
    }
  });

  //When the player connects from room view
  socket.on('player-join-room', data => {
    const player = players.getPlayer(data.id);
    if (player) {
      const room = liveRooms.getRoom(player.hostId);
      socket.join(room.pin);
      player.playerId = socket.id; //Update player id with socket id

      const playerData = players.getPlayers(room.hostId);
      socket.emit('playerRoomData', playerData);
    } else {
      console.log('noRoomFound2: ', data);
      socket.emit('noRoomFound'); //No player found
    }
  });

  //When a host or player leaves the site
  socket.on('disconnect', () => {
    const room = liveRooms.getRoom(socket.id); //Finding room with socket.id
    //If a room hosted by that id is found, the socket disconnected is a host
    console.log('disconnect: ', socket.id, room);
    if (room) {
      //Checking to see if host was disconnected or was sent to room view
      if (room.roomLive == false) {
        liveRooms.removeRoom(socket.id); //Remove the room from quizzes class
        console.log('Room ended with pin:', room.pin);

        const playersToRemove = players.getPlayers(room.hostId); //Getting all players in the room

        //For each player in the room
        for (let i = 0; i < playersToRemove.length; i++) {
          players.removePlayer(playersToRemove[i].playerId); //Removing each player from player class
        }

        io.to(room.pin).emit('hostDisconnect'); //Send player back to 'join' screen
        socket.leave(room.pin); //Socket is leaving room
      }
    } else {
      //No room has been found, so it is a player socket that has disconnected
      const player = players.getPlayer(socket.id); //Getting player with socket.id
      //If a player has been found with that id
      if (player) {
        const hostId = player.hostId; //Gets id of host of the room
        const room = liveRooms.getRoom(hostId); //Gets room data with hostId
        const pin = room.pin; //Gets the pin of the room

        if (room.roomLive == false) {
          players.removePlayer(socket.id); //Removes player from players class
          const playersInRoom = players.getPlayers(hostId); //Gets remaining players in room

          io.to(pin).emit('updatePlayerLobby', playersInRoom); //Sends data to host to update screen
          socket.leave(pin); //Player is leaving the room
        }
      }
    }
  });

  //Sets data in player class to answer from player
  socket.on('playerAnswer', async num => {
    const player = players.getPlayer(socket.id);
    if (!player) {
      return socket.emit('noRoomFound');
    }
    const hostId = player.hostId;
    const playerNum = players.getPlayers(hostId);
    const room = liveRooms.getRoom(hostId);
    if (room.roomData.questionLive == true) {
      //if the question is still live
      player.roomData.answer = num;
      room.roomData.playersAnswered += 1;

      const roomQuestion = room.roomData.question;
      const quizId = room.roomData.quizId;
      console.log('quizId: ', quizId);

      const quiz = await Quizzes.findOne({ _id: quizId });
      const questions = await Questions.find({ quizId: quiz._id });
      console.log('questions', questions, roomQuestion);

      const correctAnswer = questions[roomQuestion - 1].correctAnswer;
      //Checks player answer with correct answer
      console.log('correctAnswer', correctAnswer);
      if (num == correctAnswer) {
        player.roomData.score += 1;
        io.to(room.pin).emit('getTime', socket.id);
        socket.emit('answerResult', true);
      }

      //Checks if all players answered
      if (room.roomData.playersAnswered == playerNum.length) {
        room.roomData.questionLive = false; //Question has been ended bc players all answered under time
        const playerData = players.getPlayers(room.hostId);
        io.to(room.pin).emit('questionOver', playerData, correctAnswer); //Tell everyone that question is over
      } else {
        //update host screen of num players answered
        io.to(room.pin).emit('updatePlayersAnswered', {
          playersInRoom: playerNum.length,
          playersAnswered: room.roomData.playersAnswered,
        });
      }
    }
  });

  socket.on('getScore', function () {
    const player = players.getPlayer(socket.id);
    socket.emit('newScore', player.roomData.score);
  });

  socket.on('time', function (data) {
    let time = data.time / 20;
    time = time * 100;
    const playerid = data.player;
    const player = players.getPlayer(playerid);
    player.roomData.score += time;
  });

  socket.on('timeUp', async () => {
    const room = liveRooms.getRoom(socket.id);
    room.roomData.questionLive = false;
    const playerData = players.getPlayers(room.hostId);

    const roomQuestion = room.roomData.question;
    const quizId = room.roomData.quizId;

    const quiz = await Quizzes.findOne({ _id: quizId });
    const questions = await Questions.find({ quizId: quiz._id });

    const correctAnswer = questions[roomQuestion - 1].correctAnswer;
    io.to(room.pin).emit('questionOver', playerData, correctAnswer);
  });

  socket.on('nextQuestion', async () => {
    const playerData = players.getPlayers(socket.id);
    //Reset players current answer to 0
    for (let i = 0; i < Object.keys(players.players).length; i++) {
      if (players.players[i].hostId == socket.id) {
        players.players[i].roomData.answer = 0;
      }
    }

    const room = liveRooms.getRoom(socket.id);
    room.roomData.playersAnswered = 0;
    room.roomData.questionLive = true;
    room.roomData.question += 1;
    const quizId = room.roomData.quizId;

    const quiz = await Quizzes.findOne({ _id: quizId });
    const questions = await Questions.find({ quizId: quiz._id });

    if (questions.length >= room.roomData.question) {
      let questionNum = room.roomData.question;
      questionNum = questionNum - 1;
      const question = questions[questionNum].question;
      const answer1 = questions[questionNum].answers[0];
      const answer2 = questions[questionNum].answers[1];
      const answer3 = questions[questionNum].answers[2];
      const answer4 = questions[questionNum].answers[3];
      const correctAnswer = questions[questionNum].correctAnswer;

      socket.emit('roomQuestions', {
        q1: question,
        a1: answer1,
        a2: answer2,
        a3: answer3,
        a4: answer4,
        correct: correctAnswer,
        playersInRoom: playerData.length,
      });
    } else {
      const playersInRoom = players.getPlayers(room.hostId);
      const first = { name: '', score: 0 };
      const second = { name: '', score: 0 };
      const third = { name: '', score: 0 };
      const fourth = { name: '', score: 0 };
      const fifth = { name: '', score: 0 };

      for (let i = 0; i < playersInRoom.length; i++) {
        if (playersInRoom[i].roomData.score > fifth.score) {
          if (playersInRoom[i].roomData.score > fourth.score) {
            if (playersInRoom[i].roomData.score > third.score) {
              if (playersInRoom[i].roomData.score > second.score) {
                if (playersInRoom[i].roomData.score > first.score) {
                  //First Place
                  fifth.name = fourth.name;
                  fifth.score = fourth.score;

                  fourth.name = third.name;
                  fourth.score = third.score;

                  third.name = second.name;
                  third.score = second.score;

                  second.name = first.name;
                  second.score = first.score;

                  first.name = playersInRoom[i].name;
                  first.score = playersInRoom[i].roomData.score;
                } else {
                  //Second Place
                  fifth.name = fourth.name;
                  fifth.score = fourth.score;

                  fourth.name = third.name;
                  fourth.score = third.score;

                  third.name = second.name;
                  third.score = second.score;

                  second.name = playersInRoom[i].name;
                  second.score = playersInRoom[i].roomData.score;
                }
              } else {
                //Third Place
                fifth.name = fourth.name;
                fifth.score = fourth.score;

                fourth.name = third.name;
                fourth.score = third.score;

                third.name = playersInRoom[i].name;
                third.score = playersInRoom[i].roomData.score;
              }
            } else {
              //Fourth Place
              fifth.name = fourth.name;
              fifth.score = fourth.score;

              fourth.name = playersInRoom[i].name;
              fourth.score = playersInRoom[i].roomData.score;
            }
          } else {
            //Fifth Place
            fifth.name = playersInRoom[i].name;
            fifth.score = playersInRoom[i].roomData.score;
          }
        }
      }

      io.to(room.pin).emit('RoomOver', {
        num1: first.name,
        num2: second.name,
        num3: third.name,
        num4: fourth.name,
        num5: fifth.name,
      });
    }

    io.to(room.pin).emit('nextQuestionPlayer');
  });

  //When the host starts the room
  socket.on('startRoom', () => {
    const room = liveRooms.getRoom(socket.id); //Get the room based on socket.id
    room.roomLive = true;
    socket.emit('roomStarted', room.hostId); //Tell player and host that room has started
  });

  //Give user room names data
  // get all quizzes
  socket.on('requestDbNames', async () => {
    const quizzes = await Quizzes.find();
    socket.emit('quizNamesData', quizzes);
  });

  //Give room
  socket.on('getRoom', () => {
    const room = liveRooms.getRoom(socket.id); //Get the room based on socket.id
    socket.emit('roomData', room); //Tell player and host that room has started
  });

  //Give room
  socket.on('getAllRoom', () => {
    const rooms = liveRooms.getRoom(); //Get the room based on socket.id
    socket.emit('allRoom', rooms); //Tell player and host that room has started
  });

  // Get Room By Pin
  socket.on('getRoomByPin', pin => {
    const room = liveRooms.getRoomByPin(Number(pin)); //Get the room based on socket.id
    socket.emit('roomDataFromPin', room); //Tell player and host that room has started
  });

  //Give user room names data
  socket.on('getQuiz', async ({ id }) => {
    const quiz = await Quizzes.findOne({ _id: id });
    if (!quiz) {
      socket.emit('quizData', null);
    }
    const questions = await Questions.find({ quizId: quiz._id });
    quiz.questions = questions;
    socket.emit('quizData', quiz);
  });

  socket.on('newQuiz', async data => {
    await Quizzes.create(data, async function (err, result) {
      socket.emit('startRoomFromCreator', result.id);
    });
  });
});

module.exports = io;
