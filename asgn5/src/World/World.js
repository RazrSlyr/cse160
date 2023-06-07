import { createCamera } from './components/camera.js';
import { createLights } from './components/lights.js';
import { createScene } from './components/scene.js';
import { createBox } from './components/cube.js';

import { createControls } from './systems/controls.js';
import { createRenderer } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';
import { getDrawingMaterial, getGrassMaterial, getSkyboxMaterial } from './components/materials.js';
import { createSphere } from './components/sphere.js';
import { createTree } from './components/tree.js';
import { CameraHelper, MeshPhongMaterial, Vector3 } from '../../lib/three.module.js';
import { createRock } from './components/rock.js';

import { FogExp2 } from '../../lib/three.module.js';

let camera;
let controls;
let renderer;
let scene;
let loop;

class World {
  constructor(container) {
    // Set up scene and camera
    camera = createCamera();
    renderer = createRenderer();
    scene = createScene();

    // set up fog
    const fogColor = 0x555577;
    scene.timePassed = 0;
    scene.fogDensity = 0.00;

    // Fog that comes and goes
    scene.tick = (delta) => {
      scene.timePassed += delta / 5;
      scene.fogDensity = Math.sin(scene.timePassed) / 30;
      scene.fog = new FogExp2(fogColor, scene.fogDensity);
    }

    loop = new Loop(camera, scene, renderer);
    container.append(renderer.domElement);

    // Camera controls
    controls = createControls(camera, renderer.domElement);
    controls.saveState();
    window.addEventListener("keydown", (event) => {
      if (event.key === "r") {
        controls.reset();
      }
    })


    const { ambientLight, mainLight } = createLights();
    // Make the shadow box bigger
    mainLight.shadow.camera["left"] = -40;
    mainLight.shadow.camera["right"] = 40;
    mainLight.shadow.camera["top"] = 40;
    mainLight.shadow.camera["bottom"] = -40;


    // Ground
    const grassMaterial = getGrassMaterial();
    const ground = createBox(grassMaterial);
    ground.position.y = -3;
    ground.scale.set(40, 1, 40);
    ground.receiveShadow = true;

    // Skybox
    const skyMaterial = getSkyboxMaterial();
    const sky = createSphere(skyMaterial);
    sky.scale.set(40, 40, 40);

    // Drawing Board
    const drawing = createBox(getDrawingMaterial());
    drawing.scale.set(3, 3, 0.1);
    drawing.tick = function(delta) {
      drawing.material = getDrawingMaterial();
    }

    loop.updatables.push(controls, scene, drawing);
    scene.add(ambientLight, mainLight, sky, ground, drawing);

    const resizer = new Resizer(container, camera, renderer);
  }

  async init() {
    // Add trees
    let treePositions = [
      new Vector3(-10, 3, -10),
      new Vector3(10, 3, -10),
      new Vector3(-10, 3, 10),
      new Vector3(10, 3, 10),
      new Vector3(12, 3, 0),
      new Vector3(-12, 3, 0),
      new Vector3(0, 3, -13),
      new Vector3(0, 3, 13),

    ]
    let treePromises = [];
    for (let i = 0; i < treePositions.length; i++) {
      treePromises.push(createTree());
    }
    let trees = await Promise.all(treePromises);
    for (let i = 0; i < trees.length; i++) {
      trees[i].position.copy(treePositions[i]);
      trees[i].scale.set(5, 5, 5);
      trees[i].castShadow = true;
      scene.add(trees[i]);
    }

    // Add rock
    let rockPositions = [
      new Vector3(-20, -2, 0),
      new Vector3(-18, -2, 12),
      new Vector3(-7, -2, -6),
      new Vector3(9, -2, -12),
      new Vector3(-15, -2, -8),
      new Vector3(8, -2, 12),
      new Vector3(17, -2, -19),
      new Vector3(5, -2, 19),
      new Vector3(-12, -2, -6),
      new Vector3(19, -2, -6),
      new Vector3(12, -2, 18),
    ];
    let rockPromises = [];
    for (let i = 0; i < rockPositions.length; i++) {
      rockPromises.push(createRock());
    }
    let rocks = await Promise.all(rockPromises);
    for (let i = 0; i < rocks.length; i++) {
      rocks[i].position.copy(rockPositions[i]);
      rocks[i].scale.set(0.01, 0.01, 0.01);
      rocks[i].castShadow = true;
      scene.add(rocks[i]);
    }
  }

  render() {
    renderer.render(scene, camera);
  }

  start() {
    loop.start();
  }

  stop() {
    loop.stop();
  }
}

export { World };
