class Sphere {
    constructor(color, matrix, texture) {
        this.texture = texture;
        if (texture === undefined) this.texture = -1;
        this.type = "cube";
        this.color = color;
        this.matrix = matrix;
        this.vertexBuffer = null;
        this.vertices = null;
        this.textureBuffer = null;
        this.uvCoords = null;
        this.normalBuffer = null;
        this.normals = null;
    }

    calcCoords() {
        let sin = Math.sin;
        let cos = Math.cos;

        let d = Math.PI / 10;
        let dd = Math.PI / 10;

        this.vertices = [];
        this.uvCoords = [];
        this.normals = [];

        for (let t = 0; t < Math.PI; t += d) {
            for (let r = 0; r < (2 * Math.PI); r += d) {
                // Create the 4 points
                let p1 = [sin(t) * cos(r),
                sin(t) * sin(r),
                cos(t)];

                let p2 = [sin(t + dd) * cos(r),
                sin(t + dd) * sin(r),
                cos(t + dd)];

                let p3 = [sin(t) * cos(r + dd),
                sin(t) * sin(r + dd),
                cos(t)];

                let p4 = [sin(t + dd) * cos(r + dd),
                sin(t + dd) * sin(r + dd),
                cos(t + dd)];

                this.vertices = this.vertices.concat(p1).concat(p2).concat(p3).concat(p4);
                this.normals = this.normals.concat(p1).concat(p2).concat(p3).concat(p4);
                
                this.uvCoords = this.uvCoords.concat([
                    1, 0,
                    0, 1,
                    1, 1,
                    0, 0
                ]);
            }
        }

        this.vertices = new Float32Array(this.vertices);
        this.normals = new Float32Array(this.normals);
        console.log(this.normals);
        this.uvCoords = new Float32Array(this.uvCoords);
        
    }

    makeBuffers() {
        this.vertexBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();
        this.textureBuffer = gl.createBuffer();
    }

    render() {
        if (this.vertexBuffer === null) {
            this.makeBuffers();
            this.calcCoords();
        }
        // Set color
        gl.uniform4f(u_FragColor, this.color[0], 
            this.color[1],
            this.color[2],
            this.color[3]);
        // Set texture
        gl.uniform1i(u_WhichTexture, this.texture);
        // Pass model matrix
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        // Pass the normal matrix
        let normalMat = new Matrix4();
        normalMat.setInverseOf(this.matrix);
        normalMat.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMat.elements);

        // Load position data
        
        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        // Assign the buffer object to a_Position variable
        // Each coord now has 3 parts
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);
        // Buffer data
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);


        // Load Texture Data

        if (this.texture != -1) {
            // Bind the buffer object to target
            gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
            // Each coord now has 2 parts
            gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
            // Enable the assignment to a_UV variable
            gl.enableVertexAttribArray(a_UV);
            // Buffer data
            gl.bufferData(gl.ARRAY_BUFFER, this.uvCoords, gl.DYNAMIC_DRAW);
        }

        // Load the normals data

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        // Each coord has 3 parts
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        // // Enable the assignment to a_Normal variable
        gl.enableVertexAttribArray(a_Normal);
        // // Buffer data
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.DYNAMIC_DRAW);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertices.length / 3);
        gl.disableVertexAttribArray(a_UV);
        gl.disableVertexAttribArray(a_Normal);



    }
}