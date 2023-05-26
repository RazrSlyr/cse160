class Prism {
    // The face is assumed to be defined Point3Ds in the X-Z Plane (y = 0)
    // Points are assumed to be given in the ccw direction
    // Face UV coords are assumed to be given in the same order as face pos coords
    // Side UV coord are assumed to be given in the order of top left, bottom left, top right, bottom right
    constructor(face, height, color, matrix, faceUV, sideUV, texture) {
        this.texture = texture;
        if (texture == undefined) this.texture = -1;
        // initialize prism basics
        this.height = height;
        this.type = "prism";
        this.color = color;
        if (matrix == undefined) {
            this.matrix = new Matrix4();
        } else {
            this.matrix = matrix;
        }
        this.vertexBuffer = undefined;
        this.normalBuffer = undefined;
        this.textureBuffer = undefined;

        this.face = face;

        // vertices arrays

        // Top Face
        this.top = [];
        for (let i = 0; i < face.length; i++) {
            let point = new Point3D(face[i].x, face[i].y + height / 2, face[i].z);
            this.top.push(point);
        }

        this.topFaceArray = new Float32Array(3 * face.length);
        this.topFaceArray.set(Point3D.pointsArrayToVertices(this.top));

        // normals for prisms are similar enough to the normalized version of their
        // local coordinates so I will be using that for now
        // assuming that the coordinates are provided
        this.tfNormalsArray = new Float32Array(3 * face.length);
        for (let i = 0; i < this.top.length; i++) {
            let point = this.top[i].normalize();
            this.tfNormalsArray[i * 3] = point.x;
            this.tfNormalsArray[i * 3 + 1] = point.y;
            this.tfNormalsArray[i * 3 + 2] = point.z;
        }

        // Bottom Face
        this.bottom = [];
        for (let i = 0; i < face.length; i++) {
            let point = new Point3D(face[i].x, face[i].y - height / 2, face[i].z);
            this.bottom.push(point);
        }

        this.bottomFaceArray = new Float32Array(3 * face.length);
        this.bottomFaceArray.set(Point3D.pointsArrayToVertices(this.bottom));

        // normals for prisms are similar enough to the normalized version of their
        // local coordinates so I will be using that for now
        // assuming that the coordinates are provided
        this.bfNormalsArray = new Float32Array(3 * face.length);
        for (let i = 0; i < this.top.length; i++) {
            let point = this.bottom[i].normalize();
            this.bfNormalsArray[i * 3] = point.x;
            this.bfNormalsArray[i * 3 + 1] = point.y;
            this.bfNormalsArray[i * 3 + 2] = point.z;
        }

        // Side Faces
        this.sideArrays = null;

        if (this.texture !== -1 && faceUV !== undefined) {
            // Texture
            this.faceTexArr = new Float32Array(2 * face.length);
            this.faceTexArr.set(faceUV);
            this.sideTexArr = new Float32Array(8); // 4 vertices times 2 parts per vertex
            this.sideTexArr.set(sideUV);
        }

        this.sfNormalsArrays = null;
    }

    drawTopFace() {

        // Create a buffer object
        if (this.vertexBuffer == undefined) {
            this.vertexBuffer = gl.createBuffer();
            if (!this.vertexBuffer) {
                console.log('Failed to create the vertex buffer object');
                return -1;
            }
        }

        if (this.normalBuffer === undefined) {
            this.normalBuffer = gl.createBuffer();
            if (!this.normalBuffer) {
                console.log('Failed to create the normal buffer object');
                return -1;
            }
        }

        if (this.texture != -1 && this.textureBuffer == undefined) {
            this.textureBuffer = gl.createBuffer();
            if (!this.textureBuffer) {
                console.log('Failed to create the texture buffer object');
                return -1;
            }
        }

        // Load position data

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        // Assign the buffer object to a_Position variable
        // Each coord now has 3 parts
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);
        // Buffer data
        gl.bufferData(gl.ARRAY_BUFFER, this.topFaceArray, gl.DYNAMIC_DRAW);


        // Load Texture Data

        if (this.texture != -1) {
            // Bind the buffer object to target
            gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
            // Each coord now has 2 parts
            gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
            // Enable the assignment to a_UV variable
            gl.enableVertexAttribArray(a_UV);
            // Buffer data
            gl.bufferData(gl.ARRAY_BUFFER, this.faceTexArr, gl.DYNAMIC_DRAW);
        }

        // Load the normals data

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        // Each coord has 3 parts
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        // Enable the assignment to a_Normal variable
        gl.enableVertexAttribArray(a_Normal);
        // Buffer data
        gl.bufferData(gl.ARRAY_BUFFER, this.tfNormalsArray, gl.DYNAMIC_DRAW);


        // Draw the triangles
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.face.length);
        gl.disableVertexAttribArray(a_UV);
        gl.disableVertexAttribArray(a_Normal);

        // Update rgba
        // for (let i = 0; i < 3; i++) {
        //     rgba[i] -= inc[i];
        // }
        // return rgba;
    }

    drawBottomFace() {
        // Create a buffer object
        if (this.vertexBuffer == undefined) {
            this.vertexBuffer = gl.createBuffer();
            if (!this.vertexBuffer) {
                console.log('Failed to create the buffer object');
                return -1;
            }
        }

        // Add position data

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        // Assign the buffer object to a_Position variable
        // Each coord now has 3 parts
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);
        // Buffer data
        gl.bufferData(gl.ARRAY_BUFFER, this.bottomFaceArray, gl.DYNAMIC_DRAW);


        // Add texture data
        if (this.texture !== -1) {
            // Bind the buffer object to target
            gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
            // Each coord now has 2 parts
            gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
            // Enable the assignment to a_Position variable
            gl.enableVertexAttribArray(a_UV);
            // Buffer data
            gl.bufferData(gl.ARRAY_BUFFER, this.faceTexArr, gl.DYNAMIC_DRAW);
        }

        // Load the normals data

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        // Each coord has 3 parts
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        // Enable the assignment to a_Normal variable
        gl.enableVertexAttribArray(a_Normal);
        // Buffer data
        gl.bufferData(gl.ARRAY_BUFFER, this.bfNormalsArray, gl.DYNAMIC_DRAW);

        // Draw the triangles
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.face.length);
        gl.disableVertexAttribArray(a_UV);
        gl.disableVertexAttribArray(a_Normal);

        // Update rgba
        // for (let i = 0; i < 3; i++) {
        //     rgba[i] -= inc[i];
        // }
        // return rgba;
    }

    drawSideFaces() {
        // let [r, g, b, a] = rgba;

        // Initialize Side Arrays (if not already done)
        if (this.sideArrays == null) {
            this.sideArrays = [];
            this.sfNormalsArrays = [];
            for (let i = 0; i < this.face.length; i += 1) {
                let vertices = [];
                // Add top point
                vertices = vertices.concat(this.top[i % this.top.length].toArray());
                // Add bottom point
                vertices = vertices.concat(this.bottom[i % this.bottom.length].toArray());
                // Add other top point
                vertices = vertices.concat(this.top[(i + 1) % this.top.length].toArray());
                // Add other bottom point
                vertices = vertices.concat(this.bottom[(i + 1) % this.bottom.length].toArray());

                this.sideArrays.push(new Float32Array(12));
                this.sideArrays[i].set(vertices);

                // Compute Normals (for now, normalized version of vertices)
                let normals = []
                // Add top point
                normals = normals.concat(this.top[i % this.top.length].normalize().toArray());
                // Add bottom point
                normals = normals.concat(this.bottom[i % this.bottom.length].normalize().toArray());
                // Add other top point
                normals = normals.concat(this.top[(i + 1) % this.top.length].normalize().toArray());
                // Add other bottom point
                normals = normals.concat(this.bottom[(i + 1) % this.bottom.length].normalize().toArray());
                
                this.sfNormalsArrays.push(new Float32Array(12));
                this.sfNormalsArrays[i].set(normals);
            }
        }
        // Draw all sides
        for (let i = 0; i < this.face.length; i++) {
            // Draw Triangles
            // Set color

            // Add position data

            // Bind the buffer object to target
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            // Assign the buffer object to a_Position variable
            // Each coord now has 3 parts
            gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(a_Position);
            // Write data into the buffer object
            gl.bufferData(gl.ARRAY_BUFFER, this.sideArrays[i], gl.DYNAMIC_DRAW);

            // Add texture data
            if (this.texture != -1) {
                // Bind the buffer object to target
                gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
                // Each coord now has 2 parts
                gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
                // Enable the assignment to a_Position variable
                gl.enableVertexAttribArray(a_UV);
                // Buffer data
                gl.bufferData(gl.ARRAY_BUFFER, this.sideTexArr, gl.DYNAMIC_DRAW);
            }

            // Load the normals data

            // Bind the buffer object to target
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            // Each coord has 3 parts
            gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
            // // Enable the assignment to a_Normal variable
            gl.enableVertexAttribArray(a_Normal);
            // // Buffer data
            gl.bufferData(gl.ARRAY_BUFFER, this.sfNormalsArrays[i], gl.DYNAMIC_DRAW);

            // Draw the triangles
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            // Alter Color
            // r -= inc[0];
            // g -= inc[1];
            // b -= inc[2];
        }

        gl.disableVertexAttribArray(a_UV);
        gl.disableVertexAttribArray(a_Normal);

        // rgba = [r, g, b, a];
        // return rgba;

    }

    render() {
        // Pass the model matrix
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        let normalMatrix = new Matrix4();
        normalMatrix.setInverseOf(this.matrix);
        normalMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
        let rgba = this.color.slice();

        // Pass the color of a point to u_FragColor variable
        let [r, g, b, a] = rgba;
        gl.uniform4f(u_FragColor, r, g, b, a);

        // Pass which color/texture to use
        gl.uniform1i(u_WhichTexture, this.texture);




        // Draw Triangles for Prism (Using triangle strip)
        let n_faces = this.face.length + 2;
        let inc = [r / 2 / (n_faces - 1), g / 2 / (n_faces - 1), b / 2 / (n_faces - 1)]

        rgba = this.drawTopFace(rgba, inc);
        rgba = this.drawSideFaces(rgba, inc);
        rgba = this.drawBottomFace(rgba, inc);
    }
}