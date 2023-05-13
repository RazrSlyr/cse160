class Cube {
    constructor(color, matrix, texture) {
        if (texture === undefined) texture = -1;
        this.type = "cube";
        // this.position = position;
        this.color = color;
        // this.size = size;
        // this.segments = segments;

        let face = [
            new Point3D(-0.5, 0, -0.5), // Bottom Left
            new Point3D(0.5, 0, -0.5),  // Bottom right
            new Point3D(0.5, 0, 0.5),   // Top Right
            new Point3D(-0.5, 0, 0.5)   // Top Left
        ]

        let faceUV = [
            0,0,    // Bottom left
            1,0,    // Bottom right
            1,1,    // Top Right
            0,1     // Top Left
        ]

        // Sides go tl, bl, tr, br
        let sideUV = [
            0,1,    // Top Left
            0,0,    // Bottom Left
            1,1,    // Top Right
            1,0     // Bottom Right
        ]

        this.prism = new Prism(face, 1, color, matrix, faceUV, sideUV, texture);
    }

    setTexture(texture) {
        this.prism.texture = texture;
    }

    render() {
        this.prism.render();
    }
}