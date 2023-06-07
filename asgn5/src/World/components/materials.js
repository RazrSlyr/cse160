import { MeshPhongMaterial, RepeatWrapping, TextureLoader } from "../../../lib/three.module.js";

function getGrassMaterial() {
    let texturePath = "../../../assets/textures/grass/";
    let textureParts = ["aoMap", "bumpMap", "map", "normalMap", "roughnessMap"];
    const textureLoader = new TextureLoader();
    const mat = new MeshPhongMaterial();
    for (const part of textureParts) {
        textureLoader.loadAsync(`${texturePath}${textureParts}.png`).then((texture) => {
            texture.wrapS = texture.wrapT = RepeatWrapping;
            texture.repeat.set(20, 20);
            mat[part] = texture;
            mat.needsUpdate = true;
        })
    }
    return mat;
}