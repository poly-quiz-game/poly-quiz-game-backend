let io = require('socket.io')();
const mongoose = require('mongoose');

require('../../database/model/quizzes');
const Quizzes = mongoose.model('Quizzes');

require('../../database/model/questions');
const Questions = mongoose.model('Questions');

const { Games } = require('../../utils/games');
const games = new Games();

const { Players } = require('../../utils/players');
const players = new Players();

//When a connection to server is made from client
io.on('connection', socket => {
  console.log('ON');
  //When host connects for the first time
  socket.on('host-join', async data => {
    const quiz = await Quizzes.findOne({ _id: data.id });
    //A kahoot was found with the id passed in url
    if (quiz) {
      const gamePin = Math.floor(Math.random() * 90000) + 10000; //new pin for game

      games.addGame(gamePin, socket.id, false, {
        playersAnswered: 0,
        questionLive: false,
        quizId: data.id,
        question: 1,
      }); //Creates a game with pin and host id

      const game = games.getGame(socket.id); //Gets the game data

      socket.join(game.pin); //The host is joining a room based on the pin

      console.log('Game Created with pin:', game.pin);

      //Sending game pin to host so they can display it for players to join
      socket.emit('showGamePin', {
        pin: game.pin,
      });
    } else {
      socket.emit('noGameFound');
    }
  });

  //When the host connects from the game view
  socket.on('host-join-game', async data => {
    const oldHostId = data.id;
    const game = games.getGame(oldHostId); //Gets game with old host id
    if (game) {
      game.hostId = socket.id; //Changes the game host id to new host id
      socket.join(game.pin);
      const playerData = players.getPlayers(oldHostId); //Gets player in game
      for (let i = 0; i < Object.keys(players.players).length; i++) {
        if (players.players[i].hostId == oldHostId) {
          players.players[i].hostId = socket.id;
        }
      }
      const { quizId } = game.gameData;

      const quiz = await Quizzes.findOne({ _id: quizId });
      if (!quiz) {
        return socket.emit('noRoomFound'); //No room was found, redirect user
      }

      const questions = await Questions.find({ quizId });

      const question = questions[0].question;
      const answer1 = questions[0].answers[0];
      const answer2 = questions[0].answers[1];
      const answer3 = questions[0].answers[2];
      const answer4 = questions[0].answers[3];
      const correctAnswer = questions[0].correctAnswer;

      socket.emit('gameQuestions', {
        q1: question,
        a1: answer1,
        a2: answer2,
        a3: answer3,
        a4: answer4,
        correct: correctAnswer,
        playersInGame: playerData.length,
      });

      io.to(game.pin).emit('gameStartedPlayer');
      game.gameData.questionLive = true;
    } else {
      socket.emit('noGameFound'); //No game was found, redirect user
    }
  });

  //When player connects for the first time
  socket.on('player-join', params => {
    let gameFound = false; //If a game is found with pin provided by player

    //For each game in the Games class
    for (let i = 0; i < games.games.length; i++) {
      //If the pin is equal to one of the game's pin
      if (params.pin == games.games[i].pin) {
        console.log('Player connected to game');

        const hostId = games.games[i].hostId; //Get the id of host of game

        players.addPlayer(hostId, socket.id, params.name, {
          score: 0,
          answer: 0,
        }); //add player to game

        socket.join(params.pin); //Player is joining room based on pin

        const playersInGame = players.getPlayers(hostId); //Getting all players in game

        io.to(params.pin).emit('updatePlayerLobby', playersInGame); //Sending host player data to display
        gameFound = true; //Game has been found
      }
    }

    //If the game has not been found
    if (gameFound == false) {
      socket.emit('noGameFound'); //Player is sent back to 'join' page because game was not found with pin
    }
  });

  socket.on('host-kick-player', ({ hostId, playerId }) => {
    players.removePlayer(playerId); //Removing each player from player class
    const playersInGame = players.getPlayers(hostId); //Gets remaining players in game
    io.to(hostId).emit('updatePlayerLobby', playersInGame); //Sends data to host to update screen
    io.to(playerId).emit('kickedByHost');
  });

  //When the player connects from game view
  socket.on('player-join-game', data => {
    const player = players.getPlayer(data.id);
    if (player) {
      const game = games.getGame(player.hostId);
      socket.join(game.pin);
      player.playerId = socket.id; //Update player id with socket id

      const playerData = players.getPlayers(game.hostId);
      socket.emit('playerGameData', playerData);
    } else {
      socket.emit('noGameFound'); //No player found
    }
  });

  //When a host or player leaves the site
  socket.on('disconnect', () => {
    const game = games.getGame(socket.id); //Finding game with socket.id
    //If a game hosted by that id is found, the socket disconnected is a host
    if (game) {
      //Checking to see if host was disconnected or was sent to game view
      if (game.gameLive == false) {
        games.removeGame(socket.id); //Remove the game from games class
        console.log('Game ended with pin:', game.pin);

        const playersToRemove = players.getPlayers(game.hostId); //Getting all players in the game

        //For each player in the game
        for (let i = 0; i < playersToRemove.length; i++) {
          players.removePlayer(playersToRemove[i].playerId); //Removing each player from player class
        }

        io.to(game.pin).emit('hostDisconnect'); //Send player back to 'join' screen
        socket.leave(game.pin); //Socket is leaving room
      }
    } else {
      //No game has been found, so it is a player socket that has disconnected
      const player = players.getPlayer(socket.id); //Getting player with socket.id
      //If a player has been found with that id
      if (player) {
        const hostId = player.hostId; //Gets id of host of the game
        const game = games.getGame(hostId); //Gets game data with hostId
        const pin = game.pin; //Gets the pin of the game

        if (game.gameLive == false) {
          players.removePlayer(socket.id); //Removes player from players class
          const playersInGame = players.getPlayers(hostId); //Gets remaining players in game

          io.to(pin).emit('updatePlayerLobby', playersInGame); //Sends data to host to update screen
          socket.leave(pin); //Player is leaving the room
        }
      }
    }
  });

  //Sets data in player class to answer from player
  socket.on('playerAnswer', async function (num) {
    const player = players.getPlayer(socket.id);
    const hostId = player.hostId;
    const playerNum = players.getPlayers(hostId);
    const game = games.getGame(hostId);

    if (game.gameData.questionLive == true) {
      //if the question is still live
      player.gameData.answer = num;
      game.gameData.playersAnswered += 1;

      const gameQuestion = game.gameData.question;
      const { quizId } = game.gameData;

      const questions = await Questions.find({ quizId });
      const correctAnswer = questions[gameQuestion - 1].correctAnswer;
      //Checks player answer with correct answer
      if (num == correctAnswer) {
        player.gameData.score += 100;
        io.to(game.pin).emit('getTime', socket.id);
        socket.emit('answerResult', true);
      }

      //Checks if all players answered
      if (game.gameData.playersAnswered == playerNum.length) {
        game.gameData.questionLive = false; //Question has been ended bc players all answered under time
        const playerData = players.getPlayers(game.hostId);
        io.to(game.pin).emit('questionOver', playerData, correctAnswer); //Tell everyone that question is over
      } else {
        //update host screen of num players answered
        io.to(game.pin).emit('updatePlayersAnswered', {
          playersInGame: playerNum.length,
          playersAnswered: game.gameData.playersAnswered,
        });
      }
    }
  });

  socket.on('getScore', function () {
    const player = players.getPlayer(socket.id);
    socket.emit('newScore', player.gameData.score);
  });

  socket.on('time', function (data) {
    let time = data.time / 20;
    time = time * 100;
    const playerid = data.player;
    const player = players.getPlayer(playerid);
    player.gameData.score += time;
  });

  socket.on('timeUp', async function () {
    const game = games.getGame(socket.id);
    game.gameData.questionLive = false;
    const playerData = players.getPlayers(game.hostId);

    const gameQuestion = game.gameData.question;
    const quizId = game.gameData.quizId;
    const questions = await Questions.find({ quizId });

    const correctAnswer = questions[gameQuestion - 1].correctAnswer;
    io.to(game.pin).emit('questionOver', playerData, correctAnswer);
  });

  socket.on('nextQuestion', async () => {
    const playerData = players.getPlayers(socket.id);
    //Reset players current answer to 0
    for (let i = 0; i < Object.keys(players.players).length; i++) {
      if (players.players[i].hostId == socket.id) {
        players.players[i].gameData.answer = 0;
      }
    }

    const game = games.getGame(socket.id);
    game.gameData.playersAnswered = 0;
    game.gameData.questionLive = true;
    game.gameData.question += 1;
    const quizId = game.gameData.quizId;

    const questions = await Questions.find({ quizId });
    if (questions.length >= game.gameData.question) {
      let questionNum = game.gameData.question;
      questionNum = questionNum - 1;
      const question = questions[questionNum].question;
      const answer1 = questions[questionNum].answers[0];
      const answer2 = questions[questionNum].answers[1];
      const answer3 = questions[questionNum].answers[2];
      const answer4 = questions[questionNum].answers[3];
      const correctAnswer = questions[questionNum].correctAnswer;

      socket.emit('gameQuestions', {
        q1: question,
        a1: answer1,
        a2: answer2,
        a3: answer3,
        a4: answer4,
        correct: correctAnswer,
        playersInGame: playerData.length,
      });
    } else {
      const playersInGame = players.getPlayers(game.hostId);
      console.log('playersInGame: ', playersInGame);
      const first = { name: '', score: 0 };
      const second = { name: '', score: 0 };
      const third = { name: '', score: 0 };
      const fourth = { name: '', score: 0 };
      const fifth = { name: '', score: 0 };

      for (let i = 0; i < playersInGame.length; i++) {
        io.to(playersInGame[i].playerId).emit('GameOverPlayer', {
          ...playersInGame[i].gameData,
          questionLength: questions.length,
        });
        if (playersInGame[i].gameData.score > fifth.score) {
          if (playersInGame[i].gameData.score > fourth.score) {
            if (playersInGame[i].gameData.score > third.score) {
              if (playersInGame[i].gameData.score > second.score) {
                if (playersInGame[i].gameData.score > first.score) {
                  //First Place
                  fifth.name = fourth.name;
                  fifth.score = fourth.score;

                  fourth.name = third.name;
                  fourth.score = third.score;

                  third.name = second.name;
                  third.score = second.score;

                  second.name = first.name;
                  second.score = first.score;

                  first.name = playersInGame[i].name;
                  first.score = playersInGame[i].gameData.score;
                } else {
                  //Second Place
                  fifth.name = fourth.name;
                  fifth.score = fourth.score;

                  fourth.name = third.name;
                  fourth.score = third.score;

                  third.name = second.name;
                  third.score = second.score;

                  second.name = playersInGame[i].name;
                  second.score = playersInGame[i].gameData.score;
                }
              } else {
                //Third Place
                fifth.name = fourth.name;
                fifth.score = fourth.score;

                fourth.name = third.name;
                fourth.score = third.score;

                third.name = playersInGame[i].name;
                third.score = playersInGame[i].gameData.score;
              }
            } else {
              //Fourth Place
              fifth.name = fourth.name;
              fifth.score = fourth.score;

              fourth.name = playersInGame[i].name;
              fourth.score = playersInGame[i].gameData.score;
            }
          } else {
            //Fifth Place
            fifth.name = playersInGame[i].name;
            fifth.score = playersInGame[i].gameData.score;
          }
        }
      }

      io.to(game.pin).emit('GameOver', {
        num1: first.name,
        num2: second.name,
        num3: third.name,
        num4: fourth.name,
        num5: fifth.name,
      });
    }

    io.to(game.pin).emit('nextQuestionPlayer');
  });

  //When the host starts the game
  socket.on('startGame', () => {
    const game = games.getGame(socket.id); //Get the game based on socket.id
    game.gameLive = true;
    socket.emit('gameStarted', game.hostId); //Tell player and host that game has started
  });

  //Give user game names data
  socket.on('requestDbNames', async () => {
    const quizzes = await Quizzes.find();
    socket.emit('gameNamesData', quizzes);
  });

  //Give room
  socket.on('getRoom', () => {
    const room = games.getGame(socket.id); //Get the room based on socket.id
    socket.emit('roomData', room); //Tell player and host that room has started
  });

  //Give room
  socket.on('getAllRoom', () => {
    const rooms = games.getGame(); //Get the room based on socket.id
    socket.emit('allRoom', rooms); //Tell player and host that room has started
  });

  // Get Room By Pin
  socket.on('getRoomByPin', pin => {
    const room = games.getGameByPin(Number(pin)); //Get the room based on socket.id
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
