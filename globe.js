
const importMap = document.createElement('script');
importMap.type = 'importmap';
importMap.innerHTML = JSON.stringify({
  imports: {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/examples/jsm/controls/OrbitControls.js": "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js"
  }
});
document.currentScript.before(importMap);

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const container = document.getElementById('container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 30);

const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0x888888));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5,3,5);
scene.add(dir);

const loader = new THREE.TextureLoader();
const earthTexture = await loader.loadAsync('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
const earthGeo = new THREE.SphereGeometry(10, 64, 64);
const earthMat = new THREE.MeshStandardMaterial({ map: earthTexture });
const earthMesh = new THREE.Mesh(earthGeo, earthMat);
scene.add(earthMesh);

function latLonToVector3(lat, lon, radius=10) {
  const phi = (90 - lat) * (Math.PI/180);
  const theta = (lon + 180) * (Math.PI/180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

const hub = { name:'Milano', lat:45.4642, lon:9.19 };
const targets = [
  { name:'New York', lat:40.7128, lon:-74.0060 },
  { name:'Tokyo', lat:35.6895, lon:139.6917 },
  { name:'São Paulo', lat:-23.5505, lon:-46.6333 },
  { name:'Sydney', lat:-33.8688, lon:151.2093 },
];

const hubPos = latLonToVector3(hub.lat, hub.lon, 10);
const hubMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 12,12),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
hubMarker.position.copy(hubPos);
scene.add(hubMarker);

targets.forEach(target => {
  const targetPos = latLonToVector3(target.lat, target.lon, 10);
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12,12),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  marker.position.copy(targetPos);
  scene.add(marker);

  const mid = hubPos.clone().lerp(targetPos, 0.5);
  mid.multiplyScalar(1.3);
  const curve = new THREE.CubicBezierCurve3(
    hubPos.clone(),
    mid.clone(),
    mid.clone(),
    targetPos.clone()
  );

  const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.05, 8, false);
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  scene.add(tube);

  const bulletGeom = new THREE.SphereGeometry(0.1,8,8);
  const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const bullet = new THREE.Mesh(bulletGeom, bulletMat);
  scene.add(bullet);

  tube.userData = { curve, bullet };
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime() * 0.1;
  earthMesh.rotation.y += 0.0005;
  scene.traverse(obj => {
    if (obj.userData && obj.userData.curve) {
      const curve = obj.userData.curve;
      const bullet = obj.userData.bullet;
      const u = (t % 1);
      const pos = curve.getPointAt(u);
      bullet.position.copy(pos);
    }
  });
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
