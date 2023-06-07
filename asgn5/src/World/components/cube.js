import { BoxGeometry, MeshPhongMaterial } from "../../../lib/three.module.js";


function createBox(material) {
    const geom = new BoxGeometry(1, 1);
    const mesh = new MeshPhongMaterial(geom, material);

    return mesh;
}

export { createBox }