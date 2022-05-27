let user;
let selectedRoomId;
let rooms = [];
let socket = io();

setUp();

function setUp() {
    setUpWebsockets();

    // Get rooms from server
    socket.emit("getRooms", "");

    // On button submit: Create a new user
    document.querySelector("#acceptNameButton").addEventListener("click", () => {
        if (username == "") return;

        socket.emit("makeUser", {
            name: username, // Variable from nameColor.js
            color: usernameColor // Variable from nameColor.js
        });
    });

    // Dialog for adding rooms
    let addRoomDialog = document.querySelector("#addRoomDialog");
    let roomNameInput = document.querySelector("#roomName");
    let showAddRoomButton = document.querySelector("#showAddRoom");

    addRoomDialog.addEventListener('cancel', (event) => {
        event.preventDefault();
    });
    addRoomDialog.addEventListener('submit', (event) => {
        if (roomNameInput.value == "") {
            event.preventDefault();
        }
    })
    showAddRoomButton.addEventListener("click", (event) => addRoomDialog.showModal());
}

function setUpWebsockets() {
    socket.on("makeUser", (data) => {
        user = data;
        notification(`User: "${data.name}" was created`);
        updateRoomsMenu();
    });

    socket.on("joinRoom", (data) => {
        notification(data);
    });

    socket.on("leaveRoom", (data) => {
        notification(data);
    });

    socket.on("makeRoom", (data) => {
        notification(`Room: "${data.name}" was created`);
    });

    socket.on("getRooms", (data) => {
        rooms = data;
        if (user == undefined) return;
        updateRoomsMenu();
    });

    socket.on("getRoom", (data) => {
        console.log(data);
    });

    socket.on("playerPositionUpdate", (data) => {
        if (typeof data !== "string") {
            updateOtherPlayer(data.userId, data.position, data.rotation);
        }
    });

    socket.on("playerLeave", (data) => {
        removeOtherPlayer(data);
    })
}

function updateRoomsMenu() {
    let roomsElement = document.querySelector("#rooms");
    roomsElement.innerHTML = "";
    
    for (let room of rooms) {
        roomsElement.appendChild(getRoomMenu(room));
    }
}

function getRoomMenu(room) {
    // Container with headings
    let div = document.createElement("div");
    div.classList.add("room");
    
    // Room title
    let title = document.createElement("h3");
    title.classList.add("roomTitle");
    title.innerText = room.name;
    div.appendChild(title);

    // Join button
    if (room.open && !room.users.map(u => u.id).includes(user.id)) {
        // If user is not already in room, render join button
        if (!rooms.map(r => r.users.map(u => u.id)).flat().includes(user.id)) {
            let button = document.createElement("button")
            button.innerText = "Join";
            button.classList.add("joinButton")
            button.onclick = () => joinRoom(room.id);
            div.appendChild(button);
        }
    }
    
    // Leave button
    else {
        let button = document.createElement("button")
        button.innerText = "Leave";
        button.classList.add("leaveButton")
        button.onclick = () => leaveRoom(room.id);
        div.appendChild(button);
    }

    // Room metadata
    let metadata = document.createElement("p");
    metadata.classList.add("roomMetadata");
    metadata.innerText = `Creator: ${room.creator.name} 
                          Users: ${room.users.length}/${room.limit}`;
    div.append(metadata);

    // List of connected users
    let usersDiv = document.createElement("div");
    usersDiv.classList.add("usersDiv");
    for (let user of room.users) {
        let userDiv = document.createElement("p");
        userDiv.classList.add("user");
        userDiv.innerText = user.name;
        userDiv.style.backgroundColor = user.color;
        usersDiv.appendChild(userDiv);
    }
    div.appendChild(usersDiv);

    return div;
}

function joinRoom(roomId) {
    selectedRoomId = roomId;
    socket.emit("joinRoom", {
        user: user,
        roomId: roomId,
    });
}

function leaveRoom(roomId) {
    selectedRoomId = roomId;
    otherPlayers = [];
    socket.emit("leaveRoom", {
        user: user,
        roomId: roomId,
    });
}

function makeRoom() {
    let name = document.querySelector("#roomName").value;
    if (name == "") return;

    // Cancel if user is already in room
    if (isInRoom()) {
        notification("Cannot create a new room if user is already in a room")
        return;
    }

    socket.emit("makeRoom", {
        user: user,
        roomName: name,
    });
}

function startBroadcastingPlayerObject() {
    setInterval(() => {
        if (isInRoom() == false) return;
        if (typeof user == "undefined") return;
        if (typeof player == "undefined") return;

        socket.emit("playerPositionUpdate", {
            position: player.position,
            rotation: player.rotation,
            userId: user.id,
            roomId: getRoom().id
        });
    }, 1000/30);
}

function notification(text) {
    Toastify({
        text: text,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: {
            background: "linear-gradient(0.85turn, rgb(115, 174, 192), rgb(127, 201, 155))",
            fontFamily: "Segoe UI",
        },
    }).showToast();
}

function isInRoom() {
    return rooms
        .map(r => r.users.map(u => u.id))
        .flat()
        .includes(user.id);
}

function getRoom() {
    return rooms.find(r => r.users.map(u => u.id).includes(user.id));
}