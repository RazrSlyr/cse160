import { getRockMaterial } from "./materials";
import { OBJLoader } from "../../../lib/OBJLoader.js";
import { MeshPhongMaterial } from "../../../lib/three.module";

let mesh;

async function createRock() {
    if (model === undefined) {
        const loader = new OBJLoader();
        mesh = await loader.loadAsync("../../../assets/models/rock2.obj");
        mesh.material = getRockMaterial();
        mesh.material.needsUpdate = true;
    }
    return mesh.clone();
}

export {createRock}