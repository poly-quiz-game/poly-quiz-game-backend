class Games {
  constructor() {
    this.games = [];
  }

  addGame = ({
    hostSocketId,
    pin,
    quizId,
    isLive = false,
    isLocked = false,
    isQuestionLive = false,
    questionIndex = 0,
    questionsLength,
    quizData,
  }) => {
    var game = {
      hostSocketId,
      pin,
      quizId,
      isLive,
      isLocked,
      isQuestionLive,
      questionIndex,
      questionsLength,
      quizData,
    };
    this.games.push(game);
    return game;
  };

  removeGame(socketId) {
    var game = this.getGame(socketId);

    if (game) {
      this.games = this.games.filter(game => game.hostSocketId !== socketId);
    }
    return game;
  }
  getGame(socketId) {
    if (socketId) {
      return this.games.filter(game => game.hostSocketId === socketId)[0];
    }
    return this.games;
  }
  getAllGames() {
    return this.games;
  }
  getGameByPin(pin) {
    return this.games.filter(game => game.pin == pin)[0];
  }
}

module.exports = { Games };
