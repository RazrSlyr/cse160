class Triangle {
    constructor(coords, vertexBuffer, color) {
        this.coords = new Float32Array(coords);
        this.vertexBuffer = vertexBuffer;
        if (vertexBuffer === undefined) this.vertexBuffer = gl.createBuffer();
        this.color = color;
    }

    render() {
        // Pass the color of a point to u_FragColor variable
        let [r, g, b, a] = this.color;
        gl.uniform4f(u_FragColor, r, g, b, a);

        // Tell it to use color
        gl.uniform1i(u_WhichTexture, -1);

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // Write data into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, this.coords, _gl.DYNAMIC_DRAW);

        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_Position, 3, _gl.FLOAT, false, 0, 0);

        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        // Draw the triangle
        gl.drawArrays(gl.TRIANGLES, 0, n);
    }


}

function drawTriangle3D(coords, vertexBuffer) {
    let n = 3;

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }



}