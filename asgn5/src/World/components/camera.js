import { PerspectiveCamera } from '../../../../lib/three.module.js';

function createCamera() {
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);

  camera.position.set(0, 0, 10);

  return camera;
}

export { createCamera };
