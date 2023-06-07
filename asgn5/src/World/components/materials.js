import { BackSide, MeshBasicMaterial, MeshPhongMaterial, RepeatWrapping, TextureLoader } from "../../../lib/three.module.js";

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

function getSkyboxMaterial() {
    const textureLoader = new TextureLoader();
    const mat = new MeshBasicMaterial();
    textureLoader.loadAsync("../../../assets/textures/skybox/skybox.jpg").then((texture) => {
        mat.side = BackSide;
        mat.map = texture;
    });
    return mat;
}

function getRockMaterial() {
    let texturePath = "../../../assets/textures/rock/";
    let textureParts = ["aoMap", "bumpMap", "map", "normalMap", "roughnessMap"];
    const textureLoader = new TextureLoader();
    const mat = new MeshPhongMaterial();
    for (const part of textureParts) {
        textureLoader.loadAsync(`${texturePath}${textureParts}.png`).then((texture) => {
            mat[part] = texture;
            mat.needsUpdate = true;
        })
    }
    return mat;
}

export { getGrassMaterial, getSkyboxMaterial, getRockMaterial}