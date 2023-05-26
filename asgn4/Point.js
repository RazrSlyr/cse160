class Point {
    constructor(position, color, size) {
        this.type = "point";
        this.position = position;
        this.color = color;
        this.size = size;
    }

    render() {
        console.log("Drawing a square");
        let xy = this.position;
        let rgba = this.color;

        // Quit using the buffer to send the attribute
        gl.disableVertexAttribArray(a_Position);

        // Pass the position of a point to a_Position variable
        gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        gl.vertexAttrib1f(a_Size, this.size);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // Draw
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}

class Point3D {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        if (z == undefined) {
            this.z = 0;
        } else {
            this.z = z;
        }
    }

    copy() {
        return new Point3D(+this.x, +this.y, +this.z);
    }

    toArray() {
        return [this.x, this.y, this.z];
    }

    static pointsArrayToVertices(arr) {
        let out = [];
        for (let i = 0; i < arr.length; i++) {
            out = out.concat(arr[i].toArray());
        }
        return out;
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalizeSelf() {
        let magnitude = this.magnitude();
        this.x /= magnitude;
        this.y /= magnitude;
        this.z /= magnitude;
        return this;
    }

    normalize() {
        let copy = this.copy();
        return copy.normalizeSelf();
    }
}