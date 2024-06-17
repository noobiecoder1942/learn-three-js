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

const tubeGeometry = new THREE.TubeGeometry(spline, 222, 0.65, 16, true);

const vertexShader = `
    varying float vY;
    void main() {
        vY = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    varying float vY;

    vec3 getColor(float t) {
        vec3 color1 = vec3(0.0, 0.0, 1.0); // Blue
        vec3 color2 = vec3(0.0, 1.0, 0.0); // Green
        vec3 color3 = vec3(1.0, 1.0, 0.0); // Yellow
        vec3 color4 = vec3(1.0, 0.0, 0.0); // Red

        if (t < 0.33) {
            float normalizedT = t / 0.33;
            return mix(color1, color2, normalizedT);
        } else if (t < 0.66) {
            float normalizedT = (t - 0.33) / 0.33;
            return mix(color2, color3, normalizedT);
        } else {
            float normalizedT = (t - 0.66) / 0.34;
            return mix(color3, color4, normalizedT);
        }
    }

    void main() {
        float minY = -1.8; // Adjust these values based on your geometry's Y range
        float maxY = 5.96;
        float t = (vY - minY) / (maxY - minY);
        vec3 color = getColor(t);
        gl_FragColor = vec4(color, 0.8); // Set alpha to 1.0 for full opacity
    }
`;
const tubeMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide
});

const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
scene.add(tube);


const wireframeGeometry = new THREE.EdgesGeometry(tubeGeometry);
const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
const tubeLines = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
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
    const time = t * 0.05;
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});