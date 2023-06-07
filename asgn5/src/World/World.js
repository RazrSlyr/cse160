import { loadBirds } from './components/birds/birds.js';
import { createCamera } from './components/camera.js';
import { createLights } from './components/lights.js';
import { createScene } from './components/scene.js';
import { createBox } from './components/cube.js';

import { createControls } from './systems/controls.js';
import { createRenderer } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';
import { getGrassMaterial, getSkyboxMaterial } from './components/materials.js';
import { createSphere } from './components/sphere.js';

let camera;
let controls;
let renderer;
let scene;
let loop;

class World {
  constructor(container) {
    camera = createCamera();
    renderer = createRenderer();
    scene = createScene();
    loop = new Loop(camera, scene, renderer);
    container.append(renderer.domElement);
    controls = createControls(camera, renderer.domElement);
    controls.saveState();

    window.addEventListener("keydown", (event) => {
      if (event.key === "r") {
        controls.reset();
      }
    })


    const { ambientLight, mainLight } = createLights();

    // Ground
    const grassMaterial = getGrassMaterial();
    const ground = createBox(grassMaterial);
    ground.position.y = -3;
    ground.scale.set(40, 1, 40);

    // Skybox
    const skyMaterial = getSkyboxMaterial();
    const sky = createSphere(skyMaterial);
    sky.scale.set(40, 40, 40);
    



    loop.updatables.push(controls);
    scene.add(ambientLight, mainLight, ground, sky);

    const resizer = new Resizer(container, camera, renderer);
  }

  async init() {
    const { parrot, flamingo, stork } = await loadBirds();

    // scene.add(parrot, flamingo, stork);
    // loop.updatables.push(parrot, flamingo, stork);
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
