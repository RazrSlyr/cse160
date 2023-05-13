class Terrain {
    constructor(mapId, base_color, minHeight, maxHeight, bounds) {
        this.maxHeight = maxHeight;
        this.minHeight = minHeight;
        this.bounds = bounds;
        this.base_color = base_color;
        let image = document.getElementById(mapId);
        this.triangles = null;
        this.buffer = gl.createBuffer();
        this.imgWidth = image.width;
        this.imgHeight = image.height;
        this.gap = 10;
        this.done = false;
        this.loadImageData(image).then(() => {
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
        image.remove();
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
                ], color);
                // Second, bl, tr, br
                let triangle2 = new Triangle([
                    blx, bly, blz,
                    trx, _try, trz,
                    brx, bry, brz
                ], color);
                // Add triangles to array
                this.triangles.push(triangle1);
                this.triangles.push(triangle2);
            }
        }
    }

    render() {
        if (this.done === false) return;
        for (let i = 0; i < this.triangles.length; i++) {
            this.triangles[i].render();
        }
    }



}