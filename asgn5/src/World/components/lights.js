import { DirectionalLight, HemisphereLight } from '../../../../lib/three.module.js';

function createLights() {
  const ambientLight = new HemisphereLight(
    'skyblue',
    'darkslategrey',
    0.5,
  );

  const mainLight = new DirectionalLight('white', 1);
  mainLight.position.set(10, 10, 10);

  return { ambientLight, mainLight };
}

export { createLights };
