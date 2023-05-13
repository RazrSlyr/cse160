class Cube {
    constructor(color, matrix) {
        this.type = "cube";
        // this.position = position;
        this.color = color;
        // this.size = size;
        // this.segments = segments;

        let face = [
            new Point3D(-0.5, 0, -0.5),
            new Point3D(0.5, 0, -0.5),
            new Point3D(0.5, 0, 0.5),
            new Point3D(-0.5, 0, 0.5)
        ]
        this.prism = new Prism(face, 1, color, matrix);
    }

    render() {
        this.prism.render();

    }
}