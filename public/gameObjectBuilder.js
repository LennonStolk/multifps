/*
    This class is used for generating game objects which can then be added to the scene.
    Most objects have a builder for:
        - a mesh used for rendering (THREE.js) 
        - a body used for physics simulations (CANNON.js)
*/

class GameObjectBuilder {

    getWall(length, height, width, x, y, z) {
        const wallGeometry = new THREE.BoxGeometry(length, height, width);
        const wallTexture = new THREE.TextureLoader().load("assets/wall.jpg");
        const wallMaterial = new THREE.MeshBasicMaterial({ map: wallTexture });
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(length/2, height/2);
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.y = y;
        wall.position.z = z;
        wall.position.x = x;
        return wall;
    }

    getWallBody(length, height, width, x, y, z) {
        return new CANNON.Body({
            type: CANNON.Body.DYNAMIC,
            mass: 1000,
            position: new CANNON.Vec3(x, y, z),
            shape: new CANNON.Box(new CANNON.Vec3(length/2, height/2, width/2))
        });
    }

    getFloor(length, width) {
        const floorGeometry = new THREE.PlaneGeometry(length, width);
        const floorTexture = new THREE.TextureLoader().load("assets/paving.jpg");
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(length/1.25, width/1.25);
        const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotateX(Math.PI * 1.5);
        return floor;
    }

    getFloorBody(quaternion) {
        return new CANNON.Body({
            type: CANNON.Body.STATIC,
            quaternion: quaternion,
            shape: new CANNON.Plane()
        });
    }

    getCrate(length, width, height, x, y, z) {
        const crateGeometry = new THREE.BoxGeometry(length, width, height);
        const crateTexture = new THREE.TextureLoader().load("assets/crate.gif");
        const crateMaterial = new THREE.MeshBasicMaterial({ map: crateTexture });
        const crate = new THREE.Mesh(crateGeometry, crateMaterial);
        crate.position.y = y;
        crate.position.z = z;
        crate.position.x = x;
        return crate;
    }

    getCrateBody(length, height, width, x, y, z) {
        return new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(x, y, z),
            shape: new CANNON.Box(new CANNON.Vec3(length/2, height/2, width/2))
        });
    }

    getPlayer(gltf, visible, length, width, height, x, y, z) {
        const playerModel = gltf.scene.children[0];
        playerModel.scale.set(length, width, height);
        playerModel.position.x = x;
        playerModel.position.y = y;
        playerModel.position.z = z;
        gltf.scene.visible = visible;
        return gltf.scene;
    }
    
    getPlayerBody(length, height, width, x, y, z) {
        const playerBody = new CANNON.Body({
            type: CANNON.Body.KINEMATIC,
            position: new CANNON.Vec3(x, y, z),
            shape: new CANNON.Cylinder(length/2, height/2, width/2, 32)
        });
        playerBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
        return playerBody;
    }
}