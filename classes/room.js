const Game = require("./game");

class Room {
    constructor(creator, roomName) {
        this.id = getRandomHash();
        this.name = roomName;
        this.creator = creator;
        this.open = true;
        this.users = [creator];
        this.limit = 16;
        this.game = new Game(this.id);
    }

    addUser(user) {
        let currentUserIds = this.users.map(e => e.id);
        if (currentUserIds.includes(user.id)) return false;
        if (currentUserIds.length >= this.limit) return false;

        this.users.push(user);
        return true;
    }

    removeUser(user) {
        let currentUserIds = this.users.map(e => e.id);
        if (!currentUserIds.includes(user.id)) return false;

        this.users = this.users.filter(item => item.id !== user.id);
        return true;
    }
}

function getRandomHash() {
    let chars = "0123456789abcdef";
    let hash = "";
    for (let i = 0; i < 32; i++) {
        let randomIndex = Math.floor(Math.random() * 16);
        hash += chars[randomIndex];
    }
    return hash;
}

module.exports = Room;