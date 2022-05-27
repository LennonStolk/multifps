class User {
    constructor(userName, color, id) {
        this.name = userName;
        this.color = color;
        this.id = id;
        this.health = 100;
        this.position; // THREE.js vector3
        this.rotation; // THREE.js vector3
    }
}

module.exports = User;