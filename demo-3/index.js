import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import spline from "./spline.js";

const height = window.innerHeight;
const width = window.innerWidth;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.2);

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

const points = spline.getPoints(100);
const geometry = new THREE.BufferGeometry().setFromPoints(points);
const material = new THREE.LineBasicMaterial({
    color: 0xff0000
});
const line = new THREE.Line(geometry, material);

const tubeGeometry = new THREE.TubeGeometry(spline, 222, 0.65, 16, true);
const tubeMaterial = new THREE.MeshBasicMaterial({
    color: 0x0099ff,
    side: THREE.DoubleSide,
    wireframe: true
});

const edges = new THREE.EdgesGeometry(tubeGeometry, 0.2);
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff
});
const tubeLines = new THREE.LineSegments(edges, lineMaterial);
scene.add(tubeLines);

const numBoxes = 50;
const boxSize = 0.075;
const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
const boxMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true
});

for (let i = 0; i < numBoxes; i += 1) {
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    const p = (i / numBoxes + Math.random() * 0.1) % 1;
    const pos = tubeGeometry.parameters.path.getPointAt(p);
    pos.x += Math.random() - 0.4;
    pos.y += Math.random() - 0.4;
    box.position.copy(pos);
    const rote = new THREE.Vector3(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    box.rotation.set(rote.x, rote.y, rote.z);
    const edges = new THREE.EdgesGeometry(boxGeometry, 0.2);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const boxLines = new THREE.LineSegments(edges, lineMat);
    boxLines.position.copy(pos);
    boxLines.rotation.set(rote.x, rote.y, rote.z);
    scene.add(boxLines);
}


function updateCamera(t) {
    const time = t * 0.5;
    const looptime = 20*1000;
    const p = (time % looptime) / looptime;
    const pos = tubeGeometry.parameters.path.getPointAt(p);
    const lookAt = tubeGeometry.parameters.path.getPointAt((p+0.01)%1);
    camera.position.copy(pos);
    camera.lookAt(lookAt);
}

function animate(t = 0) {
    requestAnimationFrame(animate);
    updateCamera(t);
    renderer.render(scene, camera);
    controls.update();
}

animate();