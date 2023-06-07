import { AnimationAction, AnimationMixer } from "../../../../../lib/three.module.js";

function setupModel(data) {
  const model = data.scene.children[0];
  // Set up animations for this model
  const clip = data.animations[0];
  const mixer = new AnimationMixer(model);
  const action = mixer.clipAction(clip);
  action.play();

  model.tick = (delta) => {
    mixer.update(delta);
  }
  return model;
}

export { setupModel };
