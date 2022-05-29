const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const Room = require("./classes/room");
const User = require("./classes/user");

let rooms = [];

// Routing
app.use(express.static('public'));
server.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
});
app.get("/", (req, res) => {
    res.redirect("multifps.html");
})


// Websocket endpoints
io.on('connection', (socket) => {

    socket.on("makeUser", (newUser) => {
        let user = new User(newUser.name, newUser.color, socket.id);

        // Response to requester
        socket.emit("makeUser", user);
    });

    socket.on("makeRoom", (newRoom) => {
        let room = new Room(newRoom.user, newRoom.roomName);
        rooms.push(room);

        // Response to requester
        socket.emit("makeRoom", room);

        // Update all clients
        io.emit("getRooms", rooms);

        // Join SocketIO broadcasting room
        socket.join(room.id);
    });

    socket.on("getRooms", (data) => {
        // Response to requester
        socket.emit("getRooms", rooms);
    });

    socket.on("joinRoom", (data) => {
        let room = rooms.find(r => r.id == data.roomId)
        let success = room.addUser(data.user);

        // Response to requester
        if (success) {
            socket.emit("joinRoom", `Successfully added ${data.user.name}`);
        }
        else {
            socket.emit("joinRoom", `Could not add ${data.user.name}`);
        }

        // Update all clients
        io.emit("getRooms", rooms);

        // Join SocketIO broadcasting room
        socket.join(room.id);
    });

    socket.on("leaveRoom", (data) => {
        let room = rooms.find(r => r.id == data.roomId);
        let success = room.removeUser(data.user);

        // Remove room if empty
        if (room.users.length == 0) {
            rooms = rooms.filter(r => r.id !== room.id);
        }

        // Response to requester
        if (success) {
            socket.emit("leaveRoom", `Successfully left`);
        }
        else {
            socket.emit("leaveRoom", `Could not leave`);
        }

        // Update all clients
        io.emit("getRooms", rooms);

        // Notify clients in room
        socket.to(data.roomId).emit("playerLeave", data.user.id);

        // Leave SocketIO broadcasting room
        socket.leave(room.id);
    });

    socket.on("disconnect", (reason) => {
        // Remove disconnected user from all rooms
        let userId = socket.id;
        rooms.forEach(room => {
            let roomUsers = room.users.map(u => u.id);
            if (roomUsers.includes(userId)) {
                // Remove user
                room.users = room.users.filter(u => u.id !== userId);

                // Notify clients in room
                socket.to(room.id).emit("playerLeave", userId);
            }

            // Remove room if empty
            if (room.users.length == 0) {
                rooms = rooms.filter(r => r.id !== room.id);
            }
        });

        // Update all clients
        io.emit("getRooms", rooms);
    });

    socket.on("getRoom", (roomId) => {
        let room = rooms.find(r => r.id == roomId);
        if (room == undefined) {
            socket.emit("getRoom", "Could not find room");
        }
        else {
            socket.emit("getRoom", room);
        }
    });

    socket.on("playerPositionUpdate", (data) => {
        // Error handling
        let room = rooms.find(r => r.id == data.roomId);
        if (typeof room == "undefined") {
            socket.emit("playerObjectUpdate", "Could not find room");
            return;
        }
        let user = room.users.find(u => u.id == data.userId);
        if (typeof user == "undefined") {
            socket.emit("playerObjectUpdate", "Could not find user in room");
            return;
        }

        // Update user's position
        user.position = data.position;
        user.rotation = data.rotation;

        // Send all the other users an update
        socket.to(data.roomId).emit("playerPositionUpdate", data);

        // Success response
        socket.emit("playerObjectUpdate", "Success");
    });
});