let io = require('socket.io')();
const mongoose = require('mongoose');

require('../../database/model/quizzes');
const Quizzes = mongoose.model('Quizzes');

require('../../database/model/reports');
const Reports = mongoose.model('Reports');

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
      const game = {
        hostSocketId: socket.id,
        pin: gamePin,
        quizId: quiz._id,
        isLive: false,
        isQuestionLive: false,
        questionIndex: 0,
        questionsLength: quiz.questions.length,
        quizData: quiz,
      };

      games.addGame(game); //Creates a game with pin and host id
      socket.join(game.pin); //The host is joining a room based on the pin
      console.log('Game Created with pin:', game.pin);

      //Sending game pin to host so they can display it for players to join
      socket.emit('showGamePin', {
        pin: game.pin,
        hostSocketId: socket.id,
      });
    } else {
      socket.emit('noGameFound-host');
    }
  });

  //When the host connects from the game view
  socket.on('host-join-game', async data => {
    const oldHostSocketId = data.id;
    const game = games.getGame(oldHostSocketId); //Gets game with old host id
    if (game) {
      game.hostSocketId = socket.id; //Changes the game host id to new host id
      socket.join(game.pin);
      const playersInGame = players.getPlayers(oldHostSocketId); //Gets player in game

      for (let i = 0; i < Object.keys(players.players).length; i++) {
        if (players.players[i].hostSocketId == oldHostSocketId) {
          players.players[i].hostSocketId = socket.id;
        }
      }

      const { quizData, questionIndex } = game;

      const { questions } = quizData;
      const question = questions[questionIndex];

      // delete question._doc.correctAnswer;

      // Game info to host
      socket.emit('gameQuestion-host', question); // question, answers
      //update host screen of num players answered
      io.to(game.pin).emit('updatePlayersAnswered-host', {
        playersInGame: playersInGame.length,
        playersAnswered: 0,
      });
      socket.emit('quizInfo-host', quizData); // background, music, need login?
      socket.emit('gameInfo-host', game); // pin, question live, game live

      // Notify to player that game has started
      io.to(game.pin).emit('gameStarted-player');

      game.isQuestionLive = true;
    } else {
      socket.emit('noGameFound-host'); //No game was found, redirect user
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
        const { hostSocketId, quizData } = games.games[i]; //Get the id of host of game
        if (
          players.getPlayers(hostSocketId).length >=
          quizData._doc.numberOfPlayer
        ) {
          socket.emit('noGameFound-player'); //Player is sent back to 'join' page because game was not found with pin
          return;
        }
        players.addPlayer({
          hostSocketId,
          playerSocketId: socket.id,
          name: params.name,
          score: 0,
          answers: [],
        }); //add player to game
        socket.join(params.pin); //Player is joining room based on pin

        const playersInGame = players.getPlayers(hostSocketId); //Getting all players in game
        io.to(params.pin).emit('updatePlayerLobby-host', playersInGame); //Sending host player data to display
        gameFound = true; //Game has been found
      }
    }

    //If the game has not been found
    if (gameFound == false) {
      socket.emit('noGameFound-player'); //Player is sent back to 'join' page because game was not found with pin
    }
  });

  // check game
  socket.on('player-check-game', pin => {
    const game = games.getGameByPin(Number(pin)); //Get the game based on socket.id
    if (!game) {
      return socket.emit('noGameFound-player');
    }
    socket.emit('gameData-player', game); // game found
  });

  socket.on('host-kick-player', ({ hostSocketId, playerSocketId }) => {
    players.removePlayer(playerSocketId); //Removing each player from player class
    const playersInGame = players.getPlayers(hostSocketId); //Gets remaining players in game
    io.to(hostSocketId).emit('updatePlayerLobby-host', playersInGame); //Sends data to host to update screen
    io.to(playerSocketId).emit('kickedByHost-player');
  });

  //When the player connects from game view
  socket.on('player-join-game', ({ id: playerSocketId }) => {
    const player = players.getPlayer(playerSocketId);
    if (player) {
      const game = games.getGame(player.hostSocketId);
      socket.join(game.pin);
      player.playerSocketId = socket.id; //Update player id with socket id

      const playersInGame = players.getPlayers(game.hostSocketId);
      socket.emit('gamePlayers-host', playersInGame); // number of players in game
      socket.emit('playerInfo-player', player); // number of players in game
      socket.emit('gameInfo-player', { pin: game.pin }); // number of players in game
    } else {
      socket.emit('noGameFound-player'); //No game found
    }
  });

  //When a host or player leaves the site
  socket.on('disconnect', () => {
    const game = games.getGame(socket.id); //Finding game with socket.id
    //If a game hosted by that id is found, the socket disconnected is a host
    if (game) {
      //Checking to see if host was disconnected or was sent to game view
      if (game.isLive == false) {
        games.removeGame(socket.id); //Remove the game from games class
        console.log('Game ended with pin:', game.pin);

        const playersInGame = players.getPlayers(game.hostSocketId); //Getting all players in the game

        //For each player in the game
        for (let i = 0; i < playersInGame.length; i++) {
          players.removePlayer(playersInGame[i].playerSocketId); //Removing each player from player class
        }

        io.to(game.pin).emit('hostDisconnect-player'); //Send player back to 'join' screen
        socket.leave(game.pin); //Socket is leaving room
      }
    } else {
      //No game has been found, so it is a player socket that has disconnected
      const player = players.getPlayer(socket.id); //Getting player with socket.id
      //If a player has been found with that id
      if (player) {
        const { hostSocketId } = player; //Gets id of host of the game
        const game = games.getGame(hostSocketId); //Gets game data with hostId
        const pin = game.pin; //Gets the pin of the game

        if (game.isLive == false) {
          players.removePlayer(socket.id); //Removes player from players class
          const playersInGame = players.getPlayers(hostSocketId); //Gets remaining players in game

          io.to(pin).emit('updatePlayerLobby', playersInGame); //Sends data to host to update screen
          socket.leave(pin); //Player is leaving the room
        }
      }
    }
  });

  //Sets data in player class to answer from player
  socket.on('playerAnswer', async function (num) {
    const player = players.getPlayer(socket.id);
    if (!player) {
      socket.emit('noGameFound-player'); //No game found
      return;
    }
    const { hostSocketId } = player;

    const playersInGame = players.getPlayers(hostSocketId);
    const playerNum = playersInGame.length;

    const game = games.getGame(hostSocketId);
    if (!game) {
      socket.emit('noGameFound-player'); //No game found
      return;
    }
    if (game.isQuestionLive == true) {
      //if the question is still live
      player.answers.push(num);

      const { questionIndex, quizData } = game;

      const { questions } = quizData;
      console.log(questions, questions[questionIndex], questionIndex);
      const { correctAnswer } = questions[questionIndex];

      //Checks player answer with correct answer
      if (num == correctAnswer) {
        player.score += 100;
        io.to(game.pin).emit('getTime', socket.id);
        socket.emit('answerResult-player', true);
      }

      const playersAnswered = playersInGame.reduce((prev, player) => {
        return (prev += player.answers[questionIndex] !== undefined ? 1 : 0);
      }, 0);

      //Checks if all players answered
      if (playersAnswered == playerNum) {
        game.isQuestionLive = false; //Question has been ended bc players all answered under time
        const playersInGame = players.getPlayers(hostSocketId);
        // socket.emit('playerInfo-player', player); // number of players in game
        io.to(game.pin).emit('questionOver-all', playersInGame, player); //Tell everyone that question is over
      } else {
        //update host screen of num players answered
        io.to(game.hostSocketId).emit('updatePlayersAnswered-host', {
          playersInGame: playerNum,
          playersAnswered,
        });
      }
    }
  });

  socket.on('getScore', function () {
    const player = players.getPlayer(socket.id);
    socket.emit('newScore', player.score);
  });

  socket.on('time', function (data) {
    let time = data.time / 20;
    time = time * 100;
    const playerid = data.player;
    const player = players.getPlayer(playerid);
    player.score += time;
  });

  socket.on('timeUp', async function () {
    const game = games.getGame(socket.id);
    const playersInGame = players.getPlayers(game.hostSocketId);

    game.isQuestionLive = false;

    const { questionIndex, quizData } = game;

    const questions = quizData;
    const correctAnswer = questions[questionIndex].correctAnswer;

    io.to(game.pin).emit('questionOver-all', playersInGame, correctAnswer);
  });

  socket.on('host-nextQuestion', async () => {
    const game = games.getGame(socket.id);
    console.log('game', game);
    if (!game) {
      socket.emit('noGameFound-host'); //No game found
      return;
    }
    game.isQuestionLive = true;
    game.questionIndex += 1;

    const { quizData } = game;

    const { questions } = quizData;

    // next question
    if (questions.length > game.questionIndex) {
      const question = questions[game.questionIndex];
      const playersInGame = players.getPlayers(socket.id);
      io.to(game.pin).emit('updatePlayersAnswered-host', {
        playersInGame: playersInGame.length,
        playersAnswered: 0,
      });
      socket.emit('gameQuestion-host', question);
      socket.emit('gameInfo-host', game); // pin, question live, game live
    } else {
      // game over
      const playersInGame = players.getPlayers(game.hostSocketId);
      const first = { name: '', score: 0 };
      const second = { name: '', score: 0 };
      const third = { name: '', score: 0 };
      const fourth = { name: '', score: 0 };
      const fifth = { name: '', score: 0 };

      const reportPlayers = playersInGame.map(player => ({
        name: player.name,
        score: player.score,
      }));

      const reportQuiz = {
        name: game.quizData.name,
        description: game.quizData.description,
        questions: game.quizData.questions,
        numberOfPlayer: game.quizData.numberOfPlayer,
        needLogin: game.quizData.needLogin,
    };
      const report = {
        user: quizData.user,
        name: quizData.name,
        players: reportPlayers,
        questions,
        quiz: reportQuiz,
      };

      const resReport = await Reports.create(report);

      await Quizzes.update(
        { _id: quizData._id },
        { $push: { reports: resReport._id } }
      );

      for (let i = 0; i < playersInGame.length; i++) {
        io.to(playersInGame[i].playerSocketId).emit('GameOverPlayer', {
          ...playersInGame[i],
          questionLength: questions.length,
        });
        if (playersInGame[i].score > fifth.score) {
          if (playersInGame[i].score > fourth.score) {
            if (playersInGame[i].score > third.score) {
              if (playersInGame[i].score > second.score) {
                if (playersInGame[i].score > first.score) {
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
                  first.score = playersInGame[i].score;
                } else {
                  //Second Place
                  fifth.name = fourth.name;
                  fifth.score = fourth.score;

                  fourth.name = third.name;
                  fourth.score = third.score;

                  third.name = second.name;
                  third.score = second.score;

                  second.name = playersInGame[i].name;
                  second.score = playersInGame[i].score;
                }
              } else {
                //Third Place
                fifth.name = fourth.name;
                fifth.score = fourth.score;

                fourth.name = third.name;
                fourth.score = third.score;

                third.name = playersInGame[i].name;
                third.score = playersInGame[i].score;
              }
            } else {
              //Fourth Place
              fifth.name = fourth.name;
              fifth.score = fourth.score;

              fourth.name = playersInGame[i].name;
              fourth.score = playersInGame[i].score;
            }
          } else {
            //Fifth Place
            fifth.name = playersInGame[i].name;
            fifth.score = playersInGame[i].score;
          }
        }
      }

      io.to(game.pin).emit(
        'GameOver-host',
        {
          num1: first.name,
          num2: second.name,
          num3: third.name,
          num4: fourth.name,
          num5: fifth.name,
        },
        playersInGame
      );
    }

    io.to(game.pin).emit('nextQuestionPlayer');
  });

  //When the host starts the game
  socket.on('startGame', () => {
    const game = games.getGame(socket.id); //Get the game based on socket.id
    if (!game) {
      socket.emit('noGameFound-host');
      return;
    }
    game.isLive = true;
    socket.emit('gameStarted', game.hostSocketId); //Tell player and host that game has started
    socket.emit('gameInfo-host', game); // pin, question live, game live
  });

  //Give game
  socket.on('host-getGame', () => {
    const game = games.getGame(socket.id); //Get the game based on socket.id
    if (!game) {
      socket.emit('noGameFound-host');
      return;
    }
    socket.emit('gameData-host', game);
  });
});

module.exports = io;
