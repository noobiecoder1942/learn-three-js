// Set up the scene, camera, and renderer
import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.25;
// controls.enableZoom = true;

/// Create a sphere geometry for the globe
const globeGeometry = new THREE.SphereGeometry(5, 32, 32);

// Load a custom texture map for the globe
const loader = new THREE.TextureLoader();
const globeTexture = loader.load('./assets/earth_lights.gif'); // Example globe texture

// Create a custom material for the globe with the texture map
const globeMaterial = new THREE.MeshBasicMaterial({ map: globeTexture });
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Load and position the plane
const planeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5); // Simple box for plane
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red plane
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);

// Convert latitude and longitude to 3D coordinates
function latLongToVector3(lat, lon, radius, height = 0) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius + height) * Math.sin(phi) * Math.cos(theta);
    const y = (radius + height) * Math.cos(phi);
    const z = (radius + height) * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

// Define the list of (source, destination) pairs
const routes = [
    { source: { lat: 40.7128, lon: -74.0060 }, destination: { lat: 51.5074, lon: -0.1278 } }, // New York to London
    { source: { lat: 34.0522, lon: -118.2437 }, destination: { lat: 35.6895, lon: 139.6917 } }, // Los Angeles to Tokyo
    { source: { lat: 48.8566, lon: 2.3522 }, destination: { lat: 55.7558, lon: 37.6173 } } // Paris to Moscow
];

let currentRouteIndex = 0;
let progress = 0;
const animationSpeed = 0.01; // Adjust this value to control the speed
let points = []; // Points for the trajectory

// Create the trajectory curve
const trajectoryCurve = new THREE.CatmullRomCurve3([]);

// Create the trajectory geometry
const trajectoryGeometry = new THREE.BufferGeometry();
const trajectoryMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // Green trajectory line
const trajectory = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
scene.add(trajectory);

// Function to set up the animation for a given route
function setUpAnimation(route) {
    const startPos = latLongToVector3(route.source.lat, route.source.lon, 5);
    const endPos = latLongToVector3(route.destination.lat, route.destination.lon, 5);
    const controlPoint1 = startPos.clone().multiplyScalar(1.2); // Move out from source
    const controlPoint2 = endPos.clone().multiplyScalar(1.2); // Move out from destination

    trajectoryCurve.points = [startPos, controlPoint1, controlPoint2, endPos];
    points = trajectoryCurve.getPoints(50); // Get interpolated points for smoother curve

    // Update trajectory geometry
    trajectoryGeometry.setFromPoints(points);

    return trajectoryCurve;
}

// Initialize the first route
let curve = setUpAnimation(routes[currentRouteIndex]);

// Animation function
function animatePlane() {
    if (progress < 1) {
        progress += animationSpeed;
        const currentPos = trajectoryCurve.getPointAt(progress);
        plane.position.copy(currentPos);

        // Calculate camera position to keep plane centered and higher up above the flight path
        const distance = 15; // Distance from plane
        const heightOffset = 5; // Vertical offset above the plane
        const planeXZ = new THREE.Vector3(currentPos.x, 0, currentPos.z).normalize(); // Normalize xz plane vector
        const cameraPosition = currentPos.clone().add(planeXZ.multiplyScalar(distance)).add(new THREE.Vector3(0, heightOffset, 0)); // Camera position
        camera.position.copy(cameraPosition);

        // Look at the plane from above
        const lookAtPos = currentPos.clone().add(new THREE.Vector3(0, 1, 0)); // Look at slightly above the plane
        camera.lookAt(lookAtPos);

        // Adjust field of view (fov) dynamically based on the distance to the plane
        const minFov = 20; // Minimum field of view
        const maxFov = 60; // Maximum field of view
        const fov = THREE.MathUtils.clamp(distance / 3, minFov, maxFov); // Adjust fov based on distance
        camera.fov = fov;
        camera.updateProjectionMatrix();

        // Rotate the globe to center the flight and camera
        globe.rotation.y += 0.005; // Adjust the rotation speed if needed
    }
}

// Render loop
function animate() {
    requestAnimationFrame(animate);
    animatePlane();
    renderer.render(scene, camera);
}

animate();

// Handling window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Scroll event to navigate through routes
window.addEventListener('wheel', (event) => {
    if (event.deltaY > 0) {
        currentRouteIndex = (currentRouteIndex + 1) % routes.length;
    } else {
        currentRouteIndex = (currentRouteIndex - 1 + routes.length) % routes.length;
    }

    // Reset the progress and set up the new animation
    progress = 0;
    points.length = 0;
    curve = setUpAnimation(routes[currentRouteIndex]);
});