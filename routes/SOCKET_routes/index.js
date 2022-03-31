let io = require('socket.io')();
const _ = require('lodash');
const { PrismaClient } = require('@prisma/client');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(
  '767848981447-tebf1tn4llljl98lddf4u4fp7666nqtg.apps.googleusercontent.com'
);

// const SINGLE_CORRECT_ANSWER = 'SINGLE_CORRECT_ANSWER';
// const MULTIPLE_CORRECT_ANSWER = 'MULTIPLE_CORRECT_ANSWER';
// const TRUE_FALSE_ANSWER = 'TRUE_FALSE_ANSWER';
// const TYPE_ANSWER = 'TYPE_ANSWER';

// const questionTypes = {
//   [SINGLE_CORRECT_ANSWER]: SINGLE_CORRECT_ANSWER,
//   [MULTIPLE_CORRECT_ANSWER]: MULTIPLE_CORRECT_ANSWER,
//   [TRUE_FALSE_ANSWER]: TRUE_FALSE_ANSWER,
//   [TYPE_ANSWER]: TYPE_ANSWER,
// };

const prisma = new PrismaClient();

const { Games } = require('../../utils/games');
const games = new Games();

const { Players } = require('../../utils/players');
const players = new Players();

const checkIsCorrectAnswer = (answer, { type, correctAnswer, answers }) => {
  if (type === 'TYPE_ANSWER') {
    return (
      answers[correctAnswer].answer.toLowerCase().trim() ===
      `${answer.toLowerCase().trim()}`
    );
  }

  return (
    _.difference(
      correctAnswer.split('|').filter(a => a),
      answer.split('|').filter(a => a)
    ).length === 0
  );
};

const calculateScore = ({ answerString, question }) => {
  // if (question.type.name === questionTypes.MULTIPLE_CORRECT_ANSWER) {
  //   return (
  //     question.correctAnswer.split('|').filter(function (x) {
  //       return answerString.split('|').indexOf(x) !== -1;
  //     }).length / question.correctAnswer.split('|').length
  //   );
  // }
  const isCorrect = checkIsCorrectAnswer(answerString, question);
  if (isCorrect) {
    return 1;
  }
  return 0;
};

// const getPlayerCorrectAnswers = (answers, questions) => {
//   return answers.reduce((acc, answer, index) => {
//     const question = questions[index];
//     if (checkIsCorrectAnswer(answer, question)) {
//       return [...acc, index];
//     }
//     return acc;
//   }, []);
// };

//When a connection to server is made from client

io.on('connection', socket => {
  console.log('ON');
  //When host connects for the first time
  socket.on('host-create-lobby', async data => {
    console.log('HOST CREATE LOBBY', data);
    if (!data.id) return;
    try {
      const quiz = await prisma.quiz.findUnique({
        where: {
          id: Number(data.id),
        },
        include: {
          questions: {
            include: {
              answers: true,
              type: true,
            },
          },
        },
      });
      //A kahoot was found with the id passed in url
      if (quiz) {
        const gamePin = Math.floor(Math.random() * 90000) + 10000; //new pin for game
        const game = {
          time: Date.now(),
          hostSocketId: socket.id,
          host: data.user,
          pin: gamePin,
          quizId: quiz.id,
          isLive: false,
          isLocked: false,
          isQuestionLive: false,
          questionIndex: 0,
          questionsLength: quiz.questions.length,
          quizData: quiz,
        };

        games.addGame(game); //Creates a game with pin and host id

        socket.join(game.pin); //  Create socket room for host

        //Sending game pin to host so they can display it for players to join
        socket.emit('lobby-info', {
          pin: game.pin,
          hostSocketId: socket.id,
        });
        const allGames = games.getAllGames();
      } else {
        socket.emit('no-quiz-found');
      }
    } catch (error) {
      socket.emit('no-quiz-found');
    }
  });

  socket.on('host-lock-lobby', async value => {
    console.log('HOST LOCK LOBBY');
    try {
      console.log('host-lock-lobby: ', value);
      const game = games.getGame(socket.id); //Get the game based on socket.id
      console.log('game: ', game);
      if (game) {
        game.isLocked = value;
        io.to(game.pin).emit('lobby-locked', value);
      }
    } catch (error) {
      console.log(error);
    }
  });

  //Give game
  socket.on('get-game-info', () => {
    console.log('GET GAME INFO');
    const game = games.getGame(socket.id); //Get the game based on socket.id
    if (!game) {
      socket.emit('no-game-found');
      return;
    }
    socket.emit('game-info', {
      pin: game.pin,
      hostSocketId: socket.id,
    });
  });

  socket.on('host-kick-player-on-lobby', ({ hostSocketId, playerSocketId }) => {
    console.log('HOST KICK PLAYER ON LOBBY');
    players.removePlayer(playerSocketId);
    const playersInGame = players.getPlayers(hostSocketId); //Gets remaining players in game

    io.to(hostSocketId).emit('lobby-players', playersInGame); //Sends data to host to update screen
    io.to(playerSocketId).emit('get-kicked');
  });

  //When the host connects from the game view
  socket.on('host-start-game', async data => {
    console.log('HOST START GAME');
    const oldHostSocketId = data.id;

    const game = games.getGame(oldHostSocketId); //Gets game with old host id
    if (!game) {
      socket.emit('no-game-found');
      return;
    }

    game.isLive = true;
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
    if (!question) {
      socket.emit('no-game-found');
      return;
    }

    // Game info to host
    socket.emit('question-info', question, game); // question, answers

    socket.emit('players-answered', {
      playersInGame: playersInGame.length,
      playersAnswered: 0,
    });

    // Notify to player that game has started
    io.to(game.pin).emit('game-started', { type: question.type });

    game.isQuestionLive = true;
  });

  //When player connects for the first time
  socket.on('player-join-lobby', async ({ pin, name, tokenId }) => {
    console.log('PLAYER JOIN LOBBY');
    let gameFound = false; //If a game is found with pin provided by player

    for (let i = 0; i < games.games.length; i++) {
      const game = games.games[i];
      if (pin == game.pin) {
        const player = { name };
        if (game.quizData.needLogin) {
          if (!tokenId) {
            socket.emit('no-game-found'); //No game found
            return;
          }
          try {
            const response = await client.verifyIdToken({
              idToken: tokenId,
              audience: process.env.O2AUTH_GOOGLE_CLIENT_ID,
              scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            });
            player.name = response.payload.name;
            player.email = response.payload.email;
            player.avatar = response.payload.picture;
          } catch (error) {
            console.log(error);
            socket.emit('no-game-found'); //No game found
            return;
          }
        }
        console.log('Player connected to game', player);

        const { hostSocketId, quizData } = game; //Get the id of host of game

        let error = '';
        const isFull =
          players.getPlayers(hostSocketId).length >= quizData.numberOfPlayer;
        const hasEmail = players
          .getPlayers(hostSocketId)
          .find(({ email }) => email && email == player.email);
        if (isFull) error = 'Phòng đã đầy';
        else if (game.isLive) error = 'Phòng đang chơi';
        else if (game.isLocked) error = 'Phòng đang bị khóa';
        else if (hasEmail)
          error = `Người chơi với email ${player.email} đã vào phòng`;
        if (error) {
          socket.emit('no-game-found', error); //Player is sent back to 'join' page because game was not found with pin
          return;
        }
        players.addPlayer({
          ...player,
          hostSocketId,
          playerSocketId: socket.id,
          score: 0,
          answers: [],
        });

        socket.join(pin); //Player is joining room based on pin

        socket.emit('joined-lobby');
        const playersInGame = players.getPlayers(hostSocketId); //Getting all players in game
        io.to(hostSocketId).emit('lobby-players', playersInGame); // number of players in game
        gameFound = true; //Game has been found
      }
    }

    //If the game has not been found
    if (gameFound == false) {
      socket.emit('no-game-found'); //No game found
    }
  });

  // check game
  socket.on('player-check-game', pin => {
    console.log('PLAYER CHECK GAME');
    console.log('player-check-game: ', pin);
    const game = games.getGameByPin(Number(pin)); //Get the game based on socket.id
    if (!game) {
      return socket.emit('no-game-found');
    }
    socket.emit('game-info', game); // game found
  });

  //When the player connects from game view
  socket.on('player-join-game', ({ socketId: playerSocketId }) => {
    console.log('PLAYER JOIN GAME');
    const player = players.getPlayer(playerSocketId);
    if (player) {
      const game = games.getGame(player.hostSocketId);
      if (!game) {
        return socket.emit('no-game-found');
      }
      socket.join(game.pin);
      player.playerSocketId = socket.id; //Update player id with socket id

      const playersInGame = players.getPlayers(game.hostSocketId);

      io.to(player.hostSocketId).emit('lobby-players', playersInGame); // number of players in game
      socket.emit('player-info', player, { pin: game.pin });

      const { quizData, questionIndex } = game;
      const { questions } = quizData;
      const question = questions[questionIndex];
      if (!question) {
        return socket.emit('no-game-found');
      }
      socket.emit('question-started', {
        type: question.type,
      });
    } else {
      socket.emit('no-game-found'); //No game found
    }
  });

  //When a host or player leaves the site
  socket.on('disconnect', () => {
    const game = games.getGame(socket.id); //Finding game with socket.id
    //If a game hosted by that id is found, the socket disconnected is a host
    if (game) {
      // HOST
      //Checking to see if host was disconnected or was sent to game view
      console.log('DISCONNECT - HOST', game);
      if (game) {
        games.removeGame(socket.id); //Remove the game from games class
        console.log('Game ended with pin:', game.pin);

        const playersInGame = players.getPlayers(game.hostSocketId); //Getting all players in the game

        //For each player in the game
        for (let i = 0; i < playersInGame.length; i++) {
          players.removePlayer(playersInGame[i].playerSocketId); //Removing each player from player class
        }

        io.to(game.pin).emit('host-disconnected'); //Send player back to 'join' screen

        socket.leave(game.pin); //Socket is leaving room
      }
    } else {
      // PLAYER
      //No game has been found, so it is a player socket that has disconnected
      const player = players.getPlayer(socket.id); //Getting player with socket.id
      //If a player has been found with that id
      if (player) {
        console.log('DISCONNECT - PLAYER', player);
        const { hostSocketId } = player; //Gets id of host of the game
        const game = games.getGame(hostSocketId); //Gets game data with hostId
        const pin = game.pin; //Gets the pin of the game

        if (game.isLive == false) {
          players.removePlayer(socket.id); //Removes player from players class
          const playersInGame = players.getPlayers(hostSocketId); //Gets remaining players in game

          io.to(player.hostSocketId).emit('lobby-players', playersInGame); // number of players in game
          socket.leave(pin); //Player is leaving the room
        }
      }
    }
  });

  // admin stop game
  socket.on('admin-stop-game', pin => {
    const game = games.getGameByPin(Number(pin)); //Get the game based on socket.id
    if (game) {
      console.log('ADMIN STOP GAME');
      if (game) {
        games.removeGame(socket.id); //Remove the game from games class
        console.log('Game ended with pin:', game.pin);

        const playersInGame = players.getPlayers(game.hostSocketId); //Getting all players in the game

        //For each player in the game
        for (let i = 0; i < playersInGame.length; i++) {
          players.removePlayer(playersInGame[i].playerSocketId); //Removing each player from player class
        }

        io.to(game.pin).emit('game-stoped'); //Send player back to 'join' screen
        socket.leave(game.pin); //Socket is leaving room
      }
    }
  });

  //Sets data in player class to answer from player
  socket.on('player-answer', async function (answerString) {
    console.log('PLAYER ANSWER');
    const player = players.getPlayer(socket.id);
    if (!player) {
      socket.emit('no-game-found'); //No game found
      return;
    }
    const { hostSocketId } = player;
    const game = games.getGame(hostSocketId);
    if (!game) {
      socket.emit('no-game-found'); //No game found
      return;
    }

    if (game.isQuestionLive == true) {
      //if the question is still live
      player.answers.push({ answer: answerString });

      const { questionIndex, quizData } = game;
      const { questions } = quizData;
      const question = questions[questionIndex];

      // if (isCorrect) {
      io.to(game.pin).emit(
        'get-player-answered-time',
        socket.id,
        question,
        answerString
      );
      // }

      const playersInGame = players.getPlayers(hostSocketId);
      const playersAnswered = playersInGame.reduce((prev, player) => {
        return (prev += player.answers[questionIndex] !== undefined ? 1 : 0);
      }, 0);

      //Checks if all players answered
      if (playersAnswered === playersInGame.length) {
        game.isQuestionLive = false;
        io.to(game.hostSocketId).emit('question-over'); //Tell everyone that question is over

        playersInGame.forEach(player => {
          const isCorrect = checkIsCorrectAnswer(
            player.answers[questionIndex].answer,
            question
          );
          player.answers[questionIndex].isCorrect = isCorrect;
          io.to(player.playerSocketId).emit('question-over', isCorrect); //Tell everyone that question is over
        });
        return;
      }

      io.to(game.hostSocketId).emit('players-answered', {
        playersInGame: playersInGame.length,
        playersAnswered,
      });
    }
  });

  socket.on('get-player-score', () => {
    console.log('GET PLAYER SCORE');
    const player = players.getPlayer(socket.id);
    const playersInGame = players.getPlayers(player.hostSocketId); //Getting all players in the game
    let rank = 1;
    let score = 0;
    [...playersInGame]
      .sort((a, b) => b.score - a.score)
      .forEach((player, index) => {
        if (player.playerSocketId === socket.id) {
          rank = index + 1;
          score = player.score;
        }
      });
    socket.emit('player-score', { score, rank });
  });

  socket.on('get-score-board', () => {
    console.log('GET SCORE BOARD');
    const playersInGame = players.getPlayers(socket.id); //Getting all players in the game
    socket.emit('score-board', playersInGame);
  });

  socket.on(
    'player-answered-time',
    ({ time, playerId, question, answerString }) => {
      console.log('PLAYER ANSWERED TIME');
      const player = players.getPlayer(playerId);
      const game = games.getGame(player.hostSocketId);
      const { timeLimit } = question;

      // const isCorrect = checkIsCorrectAnswer(answerString, question);
      const ratio = calculateScore({ time, timeLimit, answerString, question });
      const score = (ratio * (time / (timeLimit / 1000)) * 1000) | 0;
      const { questionIndex } = game;
      player.answers[questionIndex].time = time;
      player.score += score;
    }
  );

  socket.on('time-up', async function () {
    console.log('TIME UP');
    try {
      const game = games.getGame(socket.id);
      game.isQuestionLive = false;
      const playersInGame = players.getPlayers(game.hostSocketId);
      const { questionIndex, quizData } = game;
      const { questions } = quizData;
      const question = questions[questionIndex];

      playersInGame.forEach(player => {
        if (!player.answers[questionIndex]) {
          player.answers.push({ answer: '', time: 0 });
        }
        const isCorrect = player.answers[questionIndex].answer
          ? checkIsCorrectAnswer(player.answers[questionIndex].answer, question)
          : false;
        player.answers[questionIndex].isCorrect = isCorrect;
        io.to(player.playerSocketId).emit('question-over', isCorrect); //Tell everyone that question is over
      });
      io.to(game.hostSocketId).emit('question-over', playersInGame); //Tell everyone that question is over
    } catch (error) {
      console.log(error);
    }
  });

  socket.on('next-question', async () => {
    console.log('NEXT QUESTION');
    const game = games.getGame(socket.id);
    if (!game) {
      socket.emit('no-game-found'); //No game found
      return;
    }
    game.isQuestionLive = true;
    game.questionIndex += 1;

    const { quizData } = game;
    const { questions } = quizData;

    // still questions left
    if (questions.length > game.questionIndex) {
      const question = questions[game.questionIndex];
      const playersInGame = players.getPlayers(socket.id);
      io.to(game.pin).emit('players-answered', {
        playersInGame: playersInGame.length,
        playersAnswered: 0,
      });
      socket.emit('question-info', question, game); // question, answers

      io.to(game.pin).emit('question-started', {
        type: question.type,
      });
      return;
    }
    // game over
    const playersInGame = players.getPlayers(game.hostSocketId);
    const first = { name: '', score: 0 };
    const second = { name: '', score: 0 };
    const third = { name: '', score: 0 };
    const fourth = { name: '', score: 0 };
    const fifth = { name: '', score: 0 };

    const reportPlayers = playersInGame.map(player => ({
      name: player.name,
      email: player.email,
      avatar: player.avatar,
      score: player.score,
      answers: player.answers.map(a => ({ answer: a.answer, time: a.time })),
    }));
    const reportData = {
      name: quizData.name,
      quizId: quizData.id,
      userId: quizData.userId,
      reportQuestions: {
        create: quizData.questions.map(
          ({ image, correctAnswer, timeLimit, question, type, answers }) => {
            return {
              image,
              correctAnswer,
              timeLimit,
              question,
              questionTypeId: type.id,
              reportQuestionAnswers: {
                create: answers.map(({ index, answer }) => ({
                  index,
                  answer,
                })),
              },
            };
          }
        ),
      },
    };

    const createReport = await prisma.report.create({
      data: reportData,
      include: {
        reportQuestions: {
          include: {
            reportQuestionAnswers: true,
          },
        },
      },
    });
    const playerData = reportPlayers.map(
      ({ name, email, avatar, score, answers }) =>
        prisma.player.create({
          data: {
            name,
            email,
            avatar,
            score,
            reportId: createReport.id,
            playerAnswers: {
              create: answers.map(({ answer, time }, index) => ({
                answer,
                time,
                reportQuestion: {
                  connect: {
                    id: createReport.reportQuestions[index].id,
                  },
                },
              })),
            },
          },
        })
    );
    try {
      await Promise.all(playerData);
    } catch (error) {
      console.log(error);
    }

    for (let i = 0; i < playersInGame.length; i++) {
      io.to(playersInGame[i].playerSocketId).emit('game-over', {
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
      'game-over-host',
      {
        num1: first.name,
        num2: second.name,
        num3: third.name,
        num4: fourth.name,
        num5: fifth.name,
      },
      playersInGame,
      { ...quizData, players: reportPlayers.sort((a, b) => b.score - a.score) }
    );
  });

  socket.on('get-game-playing', () => {
    console.log('GET GAME PLAYING');
    const allGames = games.getAllGames();
    socket.emit('game-playing', allGames.length);
  });

  socket.on('admin-get-game-playing', () => {
    console.log('GET GAME PLAYING');
    const allGames = games.getAllGames();
    socket.emit(
      'admin-game-playing',
      allGames.map(game => ({
        ...game,
        players: players.getPlayers(game.hostSocketId),
      }))
    );
  });
});

module.exports = io;
