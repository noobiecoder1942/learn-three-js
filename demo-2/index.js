import * as THREE from "three";

import { OrbitControls } from "jsm/controls/OrbitControls.js";

const height = window.innerHeight;
const width = window.innerWidth;

const renderer = new THREE.WebGLRenderer({ antialias:true});

renderer.setSize(width, height);

document.body.appendChild(renderer.domElement);

const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;

const fov = 75;
const aspect = width / height;
const near = 0.1;
const far = 1000;

const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)

camera.position.z = 2;

const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

const loader = new THREE.TextureLoader();

const geo = new THREE.IcosahedronGeometry(1, 16);
const earthMat = new THREE.MeshStandardMaterial({
    map: loader.load("./assets/earthmap1k.jpg"),
    flatShading: true
});

const cloudsMat = new THREE.MeshStandardMaterial({
    map: loader.load("./assets/earthcloudmap.jpg"),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const earthMesh = new THREE.Mesh(geo, earthMat);
const cloudsMesh = new THREE.Mesh(geo, cloudsMat);
cloudsMesh.scale.setScalar(1.003)

earthGroup.add(earthMesh);
earthGroup.add(cloudsMesh);

scene.add(earthGroup);

const sunlight = new THREE.DirectionalLight(0xffffff);
sunlight.position.set(-2, 0.5, 1.5);
scene.add(sunlight);

function animate() {
    requestAnimationFrame(animate);
    earthMesh.rotation.y += 0.002;
    cloudsMesh.rotation.y += 0.0023;
    renderer.render(scene, camera);
    controls.update();
}

animate();