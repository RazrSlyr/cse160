import { BackSide, CanvasTexture, MeshBasicMaterial, MeshPhongMaterial, RepeatWrapping, TextureLoader } from "../../../lib/three.module.js";

function getGrassMaterial() {
    let texturePath = "../../../assets/textures/grass/";
    let textureParts = ["aoMap", "bumpMap", "map", "normalMap", "roughnessMap"];
    const textureLoader = new TextureLoader();
    const mat = new MeshPhongMaterial();
    for (const part of textureParts) {
        textureLoader.loadAsync(`${texturePath}${part}.png`).then((texture) => {
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
        textureLoader.loadAsync(`${texturePath}${part}.png`).then((texture) => {
            mat[part] = texture;
            mat.needsUpdate = true;
        })
    }
    return mat;
}

function getDrawingMaterial() {
    const ctx = document.getElementById("webgl").getContext("webgl");
    const texture = new CanvasTexture(ctx.canvas);
    const mat = new MeshPhongMaterial({
        map: texture
    });
    return mat;
}

export { getGrassMaterial, getSkyboxMaterial, getRockMaterial, getDrawingMaterial}