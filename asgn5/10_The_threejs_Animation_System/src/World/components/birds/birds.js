import { GLTFLoader } from "../../../../../lib/GLTFLoader.js";

import { setupModel } from './setupModel.js';

import { AnimationClip, NumberKeyframeTrack, VectorKeyframeTrack, AnimationMixer} from "../../../../../lib/three.module.js";  

async function loadBirds() {
  const loader = new GLTFLoader();

  const [parrotData, flamingoData, storkData] = await Promise.all([
    loader.loadAsync('/10_The_threejs_Animation_System/assets/models/Parrot.glb'),
    loader.loadAsync('/10_The_threejs_Animation_System/assets/models/Flamingo.glb'),
    loader.loadAsync('/10_The_threejs_Animation_System/assets/models/Stork.glb'),
  ]);

  console.log('Squaaawk!', parrotData);

  const parrot = setupModel(parrotData);
  console.log(parrot);
  parrot.position.set(0, 0, 2.5);

  const flamingo = setupModel(flamingoData);
  flamingo.position.set(7.5, 0, -10);

  const stork = setupModel(storkData);
  stork.position.set(0, -2.5, -10);

  return {
    parrot,
    flamingo,
    stork,
  };
}

export { loadBirds };
