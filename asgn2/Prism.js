class Prism {
    // The face is assumed to be defined Point3Ds in the X-Z Plane (y = 0)
    // Points are assumed to be given in the ccw direction
    constructor(face, height, color, matrix) {
        this.height = height;
        this.type = "prism";
        this.color = color;
        if (matrix == undefined) {
            this.matrix = new Matrix4();
        } else {
            this.matrix = matrix;
        }
        this.buffer = undefined;

        // arrays
        this.faceArray = new Float32Array(face.length * 3);
        this.sideArray = new Float32Array(12);
        this.face = face;
    }

    render() {
        let rgba = this.color;

        // Pass the color of a point to u_FragColor variable
        let [r, g, b, a] = rgba;
        gl.uniform4f(u_FragColor, r, g, b, a);

        // Pass the model matrix
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);


        // Draw Triangles for Prism (Using triangle strip)

        // Create a buffer object
        if (this.buffer == undefined) {
            this.buffer = gl.createBuffer();
            if (!this.buffer) {
                console.log('Failed to create the buffer object');
                return -1;
            }
        }

        let n_faces = this.face.length + 2;
        let inc = [r / 2 / (n_faces - 1), g / 2 / (n_faces - 1), b / 2 / (n_faces - 1)]

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        // Assign the buffer object to a_Position variable
        // Each coord now has 3 parts
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);


        let top = [];
        for (let i = 0; i < this.face.length; i++) {
            let point = new Point3D(this.face[i].x, this.face[i].y + this.height / 2, this.face[i].z);
            top.push(point);
        }
        let bottom = [];
        for (let i = 0; i < this.face.length; i++) {
            let point = new Point3D(this.face[i].x, this.face[i].y - this.height / 2, this.face[i].z);
            bottom.push(point);
        }
        let vertices;

        // Draw top face
        vertices = Point3D.pointsArrayToVertices(top);
        // Write data into the buffer object
        this.faceArray.set(vertices);
        gl.bufferData(gl.ARRAY_BUFFER, this.faceArray, gl.DYNAMIC_DRAW);

        // Draw the triangles
        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3);

        gl.uniform4f(u_FragColor, r, g, b, a);

        let alters = 0;
        // Draw side faces
        vertices = [];
        for (let i = 0; i < n_faces - 2; i += 1) {
            // Add top point
            vertices = vertices.concat(top[i % top.length].toArray());
            // Add bottom point
            vertices = vertices.concat(bottom[i % top.length].toArray());
            // Add other top point
            vertices = vertices.concat(top[(i + 1) % top.length].toArray());
            // Add other bottom point
            vertices = vertices.concat(bottom[(i + 1) % bottom.length].toArray());
            // Draw Triangles
            // Alter Color
            r -= inc[0];
            g -= inc[1];
            b -= inc[2];
            gl.uniform4f(u_FragColor, r, g, b, a);
            // Write data into the buffer object
            this.sideArray.set(vertices);
            gl.bufferData(gl.ARRAY_BUFFER, this.sideArray, gl.DYNAMIC_DRAW);
            // Draw the triangles
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length / 3);
            vertices = []
        }
        

        // Alter Color
        r -= inc[0];
        g -= inc[1];
        b -= inc[2];
        // Draw Bottom Face
        vertices = Point3D.pointsArrayToVertices(bottom);
        // Write data into the buffer object
        this.faceArray.set(vertices);
        gl.bufferData(gl.ARRAY_BUFFER, this.faceArray, gl.DYNAMIC_DRAW);    
        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3);

    }
}