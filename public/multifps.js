let camera, scene, renderer, controls;
let world;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let prevTime = performance.now();

// Game objects
let player, playerBody;
let floor, floorBody;
let crate, crateBody;
let wall, wallBody;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const loader = new THREE.GLTFLoader();
const gameObjectBuilder = new GameObjectBuilder();

init();
animate();
startBroadcastingPlayerObject();

function init() {
    // Add controllable camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.x = 0;
    camera.position.y = 1.5;
    camera.position.z = 3;

    // Create new scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcce8ff);

    // Add physics (CANNON.JS)
    world = new CANNON.World();
    world.gravity.set(0,-9.82,0);
    world.broadphase = new CANNON.NaiveBroadphase();

    addGameObjects();
    addLighting();

    // Set up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = true;
    renderer.depthWrite = true;
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize);

    addMenuListeners();
    addKeyboardListeners();
}

function updateOtherPlayer(userId, position, rotation) {
    // If doesn't already exists, Add to list of other player objects
    if (scene.getObjectByName(userId) == null) {
        loader.load( 'assets/playermodel/scene.gltf', (gltf) => {
            let otherPlayer = gameObjectBuilder.getPlayer(gltf, false, 0.020, 0.020, 0.020, 0, -0.75, 0);
            otherPlayer.name = userId;
            scene.add(otherPlayer);
        }, undefined, (e) => console.error(e) );
    }
    else { /* Update existing object */
        let otherPlayer = scene.getObjectByName(userId);
        otherPlayer.position.copy(position);
        otherPlayer.rotation.copy(rotation);
        otherPlayer.visible = true;
    }
}

function removeOtherPlayer(userId) {
    let otherPlayer = scene.getObjectByName(userId);
    scene.remove(otherPlayer);
}

function addGameObjects() {
    // Add floor with repeating texture to scene
    floor = gameObjectBuilder.getFloor(500, 500);
    floorBody = gameObjectBuilder.getFloorBody(floor.quaternion);
    scene.add(floor);
    world.addBody(floorBody);

    // Add player
    loader.load( 'assets/playermodel/scene.gltf', (gltf) => {
        player = gameObjectBuilder.getPlayer(gltf, false, 0.020, 0.020, 0.020, 0, -0.70, 0);
        playerBody = gameObjectBuilder.getPlayerBody(0.8, 0.8, 4, ...player.position);
        scene.add(player);
        world.addBody(playerBody);
    }, undefined, (e) => console.error(e) );

    // Add wall
    wall = gameObjectBuilder.getWall(9, 3, 0.5, 0, 1.5, -3);
    wallBody = gameObjectBuilder.getWallBody(9, 3, 0.5, ...wall.position);
    scene.add(wall);
    world.addBody(wallBody);

    // Add crate
    crate = gameObjectBuilder.getCrate(1, 1, 1, 0, 5, -2.5)
    crateBody = gameObjectBuilder.getCrateBody(1, 1, 1, ...crate.position);
    scene.add(crate);
    world.addBody(crateBody);
}

function addLighting() {
    // Add scene lighting
    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 6);
    light.position.set( 0, 0, 0 );
    scene.add(light);

    // Add directional lighting
    const light2 = new THREE.PointLight(0xffffff, 4, 0);
    light2.position.set( 50, 50, 50 );
    scene.add(light2);
}

function addMenuListeners() {
    controls = new THREE.PointerLockControls(camera, document.body);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');
    const resumeButton = document.getElementById("resume");

    resumeButton.addEventListener('click', function () {
        controls.lock();
    });
    controls.addEventListener('lock', function () {
        blocker.style.opacity = 0;
        instructions.style.opacity = 0;
    });
    controls.addEventListener('unlock', function () {
        blocker.style.opacity = 1;
        instructions.style.opacity = 1;
    });

    scene.add(controls.getObject());
}

function addKeyboardListeners() {
    const onKeyDown = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;
            case 'Space':
                if (canJump === true) velocity.y += 10;
                canJump = false;
                break;
        }
    };

    const onKeyUp = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now();

    if (controls.isLocked === true) {

        const delta = (time - prevTime) / 1000;
        
        // Simulate physics
        crate.position.copy(crateBody.position);
        crate.quaternion.copy(crateBody.quaternion);
        wall.position.copy(wallBody.position);
        wall.quaternion.copy(wallBody.quaternion);
        player.position.copy(camera.position);
        player.position.y -= 0.75;
        playerBody.position.copy(camera.position);
        playerBody.position.y -= 0.75;
        world.step(delta);

        // Rotate player model
        let vector = new THREE.Vector3();
        camera.getWorldDirection(vector);
        theta = Math.atan2(vector.x,vector.z);
        player.rotation.y = theta;
        
        // Decreases velocity based on mass
        velocity.x -= velocity.x * 8.0 * delta;
        velocity.z -= velocity.z * 8.0 * delta;
        velocity.y -= 9.8 * 3.0 * delta; // 3.0 = mass

        // Apply player movement
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        if (moveForward || moveBackward) velocity.z -= direction.z * 60.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 60.0 * delta;
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        controls.getObject().position.y += (velocity.y * delta);

        // Floor detection
        if (controls.getObject().position.y < 1.5) {
            velocity.y = 0;
            controls.getObject().position.y = 1.5;
            canJump = true;
        }
    }

    prevTime = time;
    renderer.render(scene, camera);
}