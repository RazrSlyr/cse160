class Terrain {
    constructor(mapId, base_color, minHeight, maxHeight, bounds, blocky_color) {
        loading.innerHTML = "Currently loading terrain map (this might take a while!)";
        this.blocky_color = blocky_color;
        if (blocky_color === undefined) this.blocky_color = false;
        this.maxHeight = maxHeight;
        this.minHeight = minHeight;
        this.bounds = bounds;
        this.base_color = base_color;
        let image = document.getElementById(mapId);
        this.triangles = null;
        this.vertexBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();
        this.imgWidth = image.width;
        this.imgHeight = image.height;
        // Larger gap = better performance, blockier look
        this.gap = 8;
        this.done = false;
        this.vertices = null;
        this.colors = null;
        this.loadImageData(image).then(() => {
            loading.innerHTML = " ";
            this.done = true;
        })
    }

    async loadImageData(image) {
        // Create canvas to extract image data
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height
        ctx.drawImage(image, 0, 0);
        // Extract image data
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Delete image
        // image.remove();
        // Get point data
        this.loadPoints(imageData.data);
    }

    loadPoints(data) {
        let points = [];
        // Loop through elements and get color averages
        let min = null;
        let max = null;
        let rowLength = this.imgWidth * 4;
        for (let i = 0; i < this.imgHeight; i += this.gap) {
            let row = [];
            for (let j = 0; j < this.imgHeight; j += this.gap) {
                let pixelIndex = rowLength * i + 4 * j;
                let r = data[pixelIndex];
                let g = data[pixelIndex + 1];
                let b = data[pixelIndex + 2];
                let avg = (r + g + b) / 3; 
                row.push(avg);
                if (min == null || min > avg) {
                    min = avg;
                }
                if (max == null || max < avg) {
                    max = avg;
                }
            }
            points.push(row);
        }
        // Normalize Data
        for (let row = 0; row < points.length; row++) {
            for (let col = 0; col < points.length; col++) {
                points[row][col] = (points[row][col] - min) / (max - min);
            }
        }
        this.loadTriangles(points);
    }

    getColorFromHeight(height) {
        let [r, g, b, a] = this.base_color;
        r = r / (this.maxHeight - this.minHeight) * (height - this.minHeight);
        g = g / (this.maxHeight - this.minHeight) * (height - this.minHeight);
        b = b / (this.maxHeight - this.minHeight) * (height - this.minHeight);

        return [r, g, b, a];
        
    }

    loadTriangles(points) {
        this.triangles = [];
        this.colors = [];
        let gapX = (this.bounds[1] - this.bounds[0]) / points[0].length;
        let gapZ = (this.bounds[3] - this.bounds[2]) / points.length;
        for (let row = 0; row < points.length - 1; row++) {
            for (let col = 0; col < points[0].length - 1; col++) {
                // Top left
                let tlx = this.bounds[0] + gapX * col;
                let tly = points[row][col] * (this.maxHeight - this.minHeight) + this.minHeight;
                let tlz = this.bounds[3] - gapZ * row;
                // Bottom Left
                let blx = this.bounds[0] + gapX * col;
                let bly = points[row + 1][col] * (this.maxHeight - this.minHeight) + this.minHeight;
                let blz = this.bounds[3] - gapZ * (row + 1);
                // Top Right
                let trx = this.bounds[0] + gapX * (col + 1);
                let _try = points[row][col + 1] * (this.maxHeight - this.minHeight) + this.minHeight;
                let trz = this.bounds[3] - gapZ * row;
                // Bottom Right
                let brx = this.bounds[0] + gapX * (col + 1);
                let bry = points[row + 1][col + 1] * (this.maxHeight - this.minHeight) + this.minHeight;
                let brz = this.bounds[3] - gapZ * (row + 1);

                let color = this.getColorFromHeight((bry + bly + _try + tly) / 4);

                // Make two corresponding trianges
                // First, tl, bl, tr
                let triangle1 = new Triangle([
                    tlx, tly, tlz,
                    blx, bly, blz,
                    trx, _try, trz
                ], color, this.vertexBuffer);
                // Second, bl, tr, br
                let triangle2 = new Triangle([
                    blx, bly, blz,
                    trx, _try, trz,
                    brx, bry, brz
                ], color, this.vertexBuffer);
                // Add triangles to array
                this.triangles.push(triangle1);
                this.triangles.push(triangle2);

                // Part of new method: Add Color to new array
                for (let i = 0; i < 3; i++) {
                    let y = triangle1.coords[1 + i * 3];
                    // Remove the line below for blockier color (if you like that look)
                    if (!this.blocky_color) color = this.getColorFromHeight(y);
                    this.colors = this.colors.concat(color);
                }

                let colors2 = [];
                for (let i = 0; i < 3; i++) {
                    let y = triangle2.coords[1 + i * 3];
                    // Remove the line below for blockier color (if you like that look)
                    if (!this.blocky_color) color = this.getColorFromHeight(y);
                    this.colors = this.colors.concat(color);
                }
            }
        }

        // Compile triangles into one big list of vertices
        let temp = [];
        for (let i = 0; i < this.triangles.length; i++) {
            for (let j = 0; j < 9; j++) {
                temp.push(this.triangles[i].coords[j]);
            }
        }
        this.vertices = new Float32Array(temp);
        this.colors = new Float32Array(this.colors);
        console.log(this.colors.length / 4 - this.vertices.length / 3);
    }

    render() {
        if (this.done === false) return;
        // Old way: render each triangle
        // for (let i = 0; i < this.triangles.length; i++) {
        //     this.triangles[i].render();
        // }

        // New Way: One huge render with a bunch of triangles at once

        // Pass the model matrix
        let idy = new Matrix4();
        gl.uniformMatrix4fv(u_ModelMatrix, false, idy.elements);

        // Tell it to use varying color
        gl.uniform1i(u_WhichTexture, -2);

        // Load position data

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        // Write data into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        // Load color data

        // Enable the assignment to a_Color variable
        gl.enableVertexAttribArray(a_Color);
        
        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        // Write data into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.DYNAMIC_DRAW);

        // Assign the buffer object to a_Color variable
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);

        

        // Draw the triangle
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
        gl.disableVertexAttribArray(a_Position);
    }



}