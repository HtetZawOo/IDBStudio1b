let camera, scene, renderer;
let yawObject, pitchObject;

let panoramaMesh;
let currentMaterial;

let started = false;

// 🎯 target rotation
let targetYaw = 0;
let targetPitch = 0;

// 🧊 smoothed rotation
let smoothYaw = 0;
let smoothPitch = 0;

// ⚙️ tuning
const smoothFactor = 0.06;
const rotationStrength = 7.5;

init();
animate();

// ==========================
// 🎬 INIT
// ==========================
function init() {

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1100
  );

  // FPS hierarchy
  yawObject = new THREE.Object3D();
  pitchObject = new THREE.Object3D();

  pitchObject.add(camera);
  yawObject.add(pitchObject);

  scene.add(yawObject);

  // renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setPixelRatio(window.devicePixelRatio);

  document.body.appendChild(renderer.domElement);

  // sphere
  const geometry = new THREE.SphereGeometry(500, 60, 40);

  geometry.scale(-1, 1, 1);

  const texture = new THREE.TextureLoader().load(
    "Pano_JPEGs/studioroom.jpg"
  );

  currentMaterial = new THREE.MeshBasicMaterial({
    map: texture
  });

  panoramaMesh = new THREE.Mesh(
    geometry,
    currentMaterial
  );

  scene.add(panoramaMesh);

  window.addEventListener(
    "resize",
    onWindowResize
  );
}

// ==========================
// 🌍 LOAD PANORAMA
// ==========================
function loadPanorama(type) {

  const panoramas = {

    daysky:
      "Pano_JPEGs/daysky.jpg",

    nightsky:
      "Pano_JPEGs/nightsky.jpg",

    snow:
      "Pano_JPEGs/snow.jpg",

    studioroom:
      "Pano_JPEGs/studioroom.jpg",

    urban:
      "Pano_JPEGs/urban.jpg"
  };

  const loader = new THREE.TextureLoader();

  loader.load(panoramas[type], function(texture) {

    currentMaterial.map.dispose();

    currentMaterial.map = texture;

    currentMaterial.needsUpdate = true;
  });

  // start head tracking once
  if (!started) {

    started = true;

    startHeadTracking();

    const menu = document.getElementById("menu");

    menu.classList.remove("start-menu");

    menu.classList.add("bottom-menu");
  }
}

// ==========================
// 👤 HEAD TRACKING
// ==========================
function startHeadTracking() {

  const video = document.getElementById("video");

  const faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  faceMesh.onResults(onFaceResults);

  const cam = new Camera(video, {

    onFrame: async () => {
      await faceMesh.send({
        image: video
      });
    },

    width: 640,
    height: 480
  });

  cam.start();
}

// ==========================
// 🧠 FACE RESULTS
// ==========================
function onFaceResults(results) {

  if (!results.multiFaceLandmarks.length) return;

  const landmarks = results.multiFaceLandmarks[0];

  // nose landmark
  const nose = landmarks[1];

  // normalized center offset
  const dx = nose.x - 0.5;
  const dy = nose.y - 0.5;

  // convert to rotation targets
  targetYaw = dx * rotationStrength;
  targetPitch = -dy * rotationStrength;
}

// ==========================
// 🔄 ANIMATION
// ==========================
function animate() {

  requestAnimationFrame(animate);

  // smoothing
  smoothYaw +=
    (targetYaw - smoothYaw) * smoothFactor;

  smoothPitch +=
    (targetPitch - smoothPitch) * smoothFactor;

  // apply rotation
  yawObject.rotation.y = smoothYaw;

  pitchObject.rotation.x = smoothPitch;

  // clamp vertical
  pitchObject.rotation.x = Math.max(
    -Math.PI / 3,
    Math.min(Math.PI / 3,
      pitchObject.rotation.x
    )
  );

  renderer.render(scene, camera);
}

// ==========================
// 📱 RESIZE
// ==========================
function onWindowResize() {

  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
}