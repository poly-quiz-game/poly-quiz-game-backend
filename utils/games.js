class Games {
  constructor() {
    this.games = [];
  }
  addGame(pin, hostId, gameLive, gameData) {
    var game = { pin, hostId, gameLive, gameData };
    this.games.push(game);
    return game;
  }
  removeGame(hostId) {
    var game = this.getGame(hostId);

    if (game) {
      this.games = this.games.filter(game => game.hostId !== hostId);
    }
    return game;
  }
  getGame(hostId) {
    if (hostId) {
      return this.games.filter(game => game.hostId === hostId)[0];
    }
    return this.games;
  }
  getGameByPin(pin) {
    return this.games.filter(game => game.pin == pin)[0];
  }
}

module.exports = { Games };
