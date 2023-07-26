import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Add your image paths here
import starsTexture from '../three.js-3D/img/stars.jpg';
import neptuneTexture from '../three.js-3D/img/neptune.jpg';



const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
); 

const orbit = new OrbitControls(camera, renderer.domElement);

// Set the initial camera position
camera.position.set(0, 150, 200);
camera.lookAt(scene.position);

const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const cubeTextureLoader = new THREE.CubeTextureLoader();
scene.background = cubeTextureLoader.load([
    starsTexture,
    starsTexture,
    starsTexture,
    starsTexture,
    starsTexture,
    starsTexture
]);

const textureLoader = new THREE.TextureLoader();

const sunGeo = new THREE.SphereGeometry(16, 30, 30);
const sunMat = new THREE.MeshBasicMaterial({
    map: textureLoader.load(neptuneTexture)
});
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// Create a variable to keep track of the raised state of each planet
const planetStates = {
    mercury: false,
    venus: false,
    earth: false,
    mars: false,
    jupiter: false,
    saturn: false,
    uranus: false,
    neptune: false,
    pluto: false,
};

function createPlanete(size, texture, position, ring) {
    const geo = new THREE.SphereGeometry(size, 30, 30);
    const mat = new THREE.MeshStandardMaterial({
        map: textureLoader.load(texture)
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = texture; // Set a unique name for each planet mesh
    const obj = new THREE.Object3D();
    obj.add(mesh);
    // if (ring) {
    //     const ringGeo = new THREE.RingGeometry(
    //         ring.innerRadius,
    //         ring.outerRadius,
    //         32
    //     );
    //     const ringMat = new THREE.MeshBasicMaterial({
    //         map: textureLoader.load(ring.texture),
    //         side: THREE.DoubleSide
    //     });
    //     const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    //     obj.add(ringMesh);
    //     ringMesh.position.x = position;
    //     ringMesh.rotation.x = -0.5 * Math.PI;
    // }
    scene.add(obj);
    mesh.position.x = position;

    // Add a click event listener to the planet's mesh
    mesh.addEventListener('click', () => {
        raisePlanet(mesh);
    });

    return { mesh, obj };
}

const mercury = createPlanete(6, neptuneTexture, 62);
const venus = createPlanete(6, neptuneTexture, 62);
const earth = createPlanete(6, neptuneTexture, 62);
const mars = createPlanete(6, neptuneTexture, 62);
// const jupiter = createPlanete(12, neptuneTexture, 100);
// const saturn = createPlanete(10, neptuneTexture, 138, {
//     innerRadius: 10,
//     outerRadius: 20,
//     texture: saturnRingTexture
// });
// const uranus = createPlanete(7, neptuneTexture, 176, {
//     innerRadius: 7,
//     outerRadius: 12,
//     texture: uranusRingTexture
// });
// const neptune = createPlanete(7, neptuneTexture, 200);
// const pluto = createPlanete(2.8, neptuneTexture, 216);

const pointLight = new THREE.PointLight(0xffffff, 2, 300);
scene.add(pointLight);

const zoomDistance = -80; // Adjust this value to control the zoom-in distance from the clicked planet
const zoomDuration = 100000; // Duration of the zoom animation in milliseconds (adjust as needed)

let zoomingIn = false;
let zoomStartTime = 0;
const originalCameraPosition = camera.position.clone();
const targetCameraPosition = new THREE.Vector3();


function raisePlanet(planetMesh) {
    const raiseAmount = 20; // The height the planet will be raised to

    // Check if the clicked planet is already raised
    const isRaised = planetStates[planetMesh.name];

    // Lower the previously raised planet if it's different from the clicked one
    const raisedPlanetName = Object.keys(planetStates).find(
        (planetName) => planetStates[planetName] && planetName !== planetMesh.name
    );

    if (raisedPlanetName) {
        const raisedPlanet = scene.getObjectByName(raisedPlanetName);
        raisedPlanet.position.y = 0;
        planetStates[raisedPlanetName] = false;

        // Calculate the target camera position for zoom-out effect
        const planetPosition = raisedPlanet.getWorldPosition(new THREE.Vector3());
        const direction = new THREE.Vector3().subVectors(planetPosition, camera.position).normalize();
        targetCameraPosition.copy(planetPosition).add(direction.clone().multiplyScalar(zoomDistance));

        // Start the zooming-out animation
        zoomingIn = false;
        zoomStartTime = Date.now();
    }

    // Toggle the state of the clicked planet (raised or not raised)
    planetStates[planetMesh.name] = !isRaised;

    // Set the Y position based on the state
    if (planetStates[planetMesh.name]) {
        planetMesh.position.y = raiseAmount;

        // Calculate the target camera position for zoom-in effect
        const planetPosition = planetMesh.getWorldPosition(new THREE.Vector3());
        const direction = new THREE.Vector3().subVectors(planetPosition, camera.position).normalize();
        targetCameraPosition.copy(planetPosition).add(direction.clone().multiplyScalar(zoomDistance));

        // Start the zooming-in animation
        zoomingIn = true;
        zoomStartTime = Date.now();
    } else {
        planetMesh.position.y = 0; // Back to the original position

        // Calculate the target camera position for zoom-out effect
        const planetPosition = planetMesh.getWorldPosition(new THREE.Vector3());
        const direction = new THREE.Vector3().subVectors(planetPosition, camera.position).normalize();
        targetCameraPosition.copy(planetPosition).add(direction.clone().multiplyScalar(zoomDistance));

        // Start the zooming-out animation
        zoomingIn = false;
        zoomStartTime = Date.now();
    }
}

function updateCameraPosition() {
    if (zoomingIn) {
        const elapsed = Date.now() - zoomStartTime;
        if (elapsed < zoomDuration) {
            const progress = elapsed / zoomDuration;
            camera.position.lerp(targetCameraPosition, progress);
        } else {
            camera.position.copy(targetCameraPosition);
        }
    } else {
        const elapsed = Date.now() - zoomStartTime;
        if (elapsed < zoomDuration) {
            const progress = elapsed / zoomDuration;
            const raisedPlanetName = Object.keys(planetStates).find(
                (planetName) => planetStates[planetName]
            );
            if (raisedPlanetName) {
                const raisedPlanet = scene.getObjectByName(raisedPlanetName);
                const planetPosition = raisedPlanet.getWorldPosition(new THREE.Vector3());
                const direction = new THREE.Vector3().subVectors(originalCameraPosition, planetPosition).normalize();
                const targetZoomOutPosition = planetPosition.clone().add(direction.clone().multiplyScalar(zoomDistance));
                camera.position.lerp(targetZoomOutPosition, progress);
            } else {
                camera.position.lerp(originalCameraPosition, progress);
            }
        } else {
            const raisedPlanetName = Object.keys(planetStates).find(
                (planetName) => planetStates[planetName]
            );
            if (raisedPlanetName) {
                const raisedPlanet = scene.getObjectByName(raisedPlanetName);
                const planetPosition = raisedPlanet.getWorldPosition(new THREE.Vector3());
                camera.position.copy(planetPosition);
            } else {
                camera.position.copy(originalCameraPosition);
            }
        }
    }
}

//  stop while raised
function animate() {
    // Check if any planet is raised
    const anyPlanetRaised = Object.values(planetStates).some((state) => state);

    // Only rotate the planets if no planet is currently raised
    if (!anyPlanetRaised) {
        //Self-rotation
        sun.rotateY(0.004);
        mercury.mesh.rotateY(0.004);
        venus.mesh.rotateY(0.002);
        earth.mesh.rotateY(0.02);
        mars.mesh.rotateY(0.018);
        // jupiter.mesh.rotateY(0.04);
        // saturn.mesh.rotateY(0.038);
        // uranus.mesh.rotateY(0.03);
        // neptune.mesh.rotateY(0.032);
        // pluto.mesh.rotateY(0.008);

        //Around-sun-rotation
        mercury.obj.rotateY(0.04);
        venus.obj.rotateY(0.015);
        earth.obj.rotateY(0.01);
        mars.obj.rotateY(0.008);
        // jupiter.obj.rotateY(0.002);
        // saturn.obj.rotateY(0.0009);
        // uranus.obj.rotateY(0.0004);
        // neptune.obj.rotateY(0.0001);
        // pluto.obj.rotateY(0.00007);
    }

    if (!zoomingIn) {
        orbit.update(); // Update the orbit controls for camera rotation
    }

    updateCameraPosition(); // Update the camera position for the zoom-in/out effect

    // Adjust the opacity of the other planets when a planet is raised
    for (const planetName in planetStates) {
        const planetObj = scene.getObjectByName(planetName);
        if (!planetObj) continue; // Skip if the planet object is not found

        if (planetStates[planetName]) {
            // The current planet is raised, increase its opacity to 1.0
            planetObj.traverse((obj) => {
                if (obj.type === 'Mesh') {
                    obj.material.opacity = 1.0;
                }
            });
        } else {
            // The current planet is not raised, decrease its opacity to 0.3 (or any desired value)
            planetObj.traverse((obj) => {
                if (obj.type === 'Mesh') {
                    obj.material.opacity = 0.3; // You can adjust the opacity value as needed
                }
            });
        }
    }

    renderer.render(scene, camera);
}


renderer.setAnimationLoop(animate);

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onDocumentMouseDown(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.type === 'Mesh') {
            raisePlanet(object);
        }
    }
}

// New event listener to handle both left-click and touch events
renderer.domElement.addEventListener('pointerdown', onPointerDown, false);

function onPointerDown(event) {
    // If it's a right-click (contextmenu), prevent the default behavior (context menu popup)
    if (event.button === 2) {
        event.preventDefault();
    } else {
        // Check for left-click (or touch) and call the corresponding function
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
            // Left-click with Ctrl/Meta/Shift pressed for camera movement
            moveCamera(event);
        } else {
            // Regular left-click for planet interaction
            onDocumentMouseDown(event);
        }
    }
}

cameraMoveSpeed = 0.5; // Adjust the camera movement speed as needed

function moveCamera(event) {
    const startMouse = new THREE.Vector2(event.clientX, event.clientY);
    const startCameraPosition = camera.position.clone();
    const targetCameraPosition = new THREE.Vector3();

    function onMouseMove(event) {
        const deltaMouse = new THREE.Vector2(
            event.clientX - startMouse.x,
            event.clientY - startMouse.y
        );
        targetCameraPosition.copy(startCameraPosition);
        targetCameraPosition.x -= deltaMouse.x * cameraMoveSpeed;
        targetCameraPosition.y += deltaMouse.y * cameraMoveSpeed;
        camera.position.copy(targetCameraPosition);
        camera.lookAt(scene.position);
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mouseup', onMouseUp, false);
}
