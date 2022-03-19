class Players {
  constructor() {
    this.players = [];
  }
  addPlayer({ hostSocketId, playerSocketId, name, email, score, answers }) {
    var player = {
      hostSocketId,
      playerSocketId,
      name,
      email,
      score,
      answers,
    };
    this.players.push(player);
    return player;
  }
  removePlayer(socketId) {
    var player = this.getPlayer(socketId);

    if (player) {
      this.players = this.players.filter(
        player => player.playerSocketId !== socketId
      );
    }
    return player;
  }
  getPlayer(playerSocketId) {
    return this.players.filter(
      player => player.playerSocketId == playerSocketId
    )[0];
  }
  getPlayerByEmail(email) {
    return this.players.filter(player => player.email == email)[0];
  }
  getPlayers(hostSocketId) {
    return this.players.filter(player => player.hostSocketId == hostSocketId);
  }
}

module.exports = { Players };
