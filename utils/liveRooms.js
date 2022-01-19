class LiveRooms {
  constructor() {
    this.rooms = [];
  }
  addRoom(pin, hostId, roomLive, roomData) {
    var room = { pin, hostId, roomLive, roomData };
    this.rooms.push(room);
    return room;
  }
  removeRoom(hostId) {
    var room = this.getRoom(hostId);

    if (room) {
      this.rooms = this.rooms.filter(room => room.hostId !== hostId);
    }
    return room;
  }
  getRoom(hostId) {
    if (hostId) {
      return this.rooms.filter(room => room.hostId === hostId)[0];
    }
    return this.rooms;
  }
  getRoomByPin(pin) {
    return this.rooms.filter(room => room.pin == pin)[0];
  }
}

module.exports = { LiveRooms };
