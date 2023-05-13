// DrawRectangle.js

let ctx;
function main()
{
    // Retrieve <canvas> element
    let canvas = document.getElementById('example')
    if (!canvas)
    {
        console.log('Failed to retrieve the <canvas> element')
        return false;
    }

    // Get the rendering context for 2DCG
    ctx = canvas.getContext('2d')

    // Draw a black rectangle for vectors to show on
    // (Also drawing a blue rectangle for the sake of the assignment)
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, 400, 400) // Fill a rectangle with the color
    clear();

    // draw starting vector
    let v = new Vector3([2.25, 2.25, 0]);
    drawVector(v, "red");
}

function drawVector(v, color) {
    // begin drawing line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(200, 200);
    ctx.lineTo(200 + 20 * v.elements[0], 200 - 20 * v.elements[1]);
    ctx.stroke();
}

function inputsToVector(x_id, y_id) {
    // get input values from html
    let x = document.getElementById(x_id).value;
    let y = document.getElementById(y_id).value;

    // make sure they exist
    if (x == "" || y == "") return false;
    return new Vector3([x, y, 0]);
}

function handleDrawEvent() {
    clear();
    a = drawFromInput("x1", "y1", "red");
    b = drawFromInput("x2", "y2", "#0000ff");
    return a && b;
}

function angleBetween(v1, v2) {
    let cos = Vector3.dot(v1, v2) / v1.magnitude() / v2.magnitude();
    return Math.acos(cos) * 180 / Math.PI;
}

function areaTriangle(v1, v2) {
    return Vector3.cross(v1, v2).magnitude() / 2;
}

function handleDrawOperationEvent() {
    handleDrawEvent();
    let op = document.getElementById("ops").value;
    let v1 = inputsToVector("x1", "y1");
    let v2 = inputsToVector("x2", "y2");
    let scalar = document.getElementById("scalar").value;
    switch (op) {
        case "add":
            if (!v1 || !v2) return false;
            v3 = v1.add(v2);
            drawVector(v3, "#00ff00");
            break;
        case "sub":
            if (!v1 || !v2) return false;
            v3 = v1.sub(v2);
            drawVector(v3, "#00ff00");
            break;
        case "mult":
            if (scalar == "") return false;
            if (v1) drawVector(v1.mul(scalar), "rgba(0, 255, 0, 0.75)");
            if (v2) drawVector(v2.mul(scalar), "rgba(0, 255, 0, 0.75)");
            break;
        case "div":
            if (scalar == "") return false;
            if (v1) drawVector(v1.div(scalar), "rgba(0, 255, 0, 0.75)");
            if (v2) drawVector(v2.div(scalar), "rgba(0, 255, 0, 0.75)");
            break;
        case "mag":
            if (v1) console.log("Magnitude v1: " + v1.magnitude());
            if (v2) console.log("Magnitude v2: " + v2.magnitude());
            break;
        case "norm":
            if (v1) drawVector(v1.normalize(), "rgba(0, 255, 0, 0.75)");
            if (v2) drawVector(v2.normalize(), "rgba(0, 255, 0, 0.75)");
            break;
        case "angle":
            if (v1 && v2) console.log("Angle: " + angleBetween(v1, v2)); 
            break;
        case "area":
            if (v1 && v2) console.log("Area of the Triangle: " + areaTriangle(v1, v2));
            break;
        default:
            break;
    }
    
}

// draw from input
function drawFromInput(id1, id2, color) {
    let v = inputsToVector(id1, id2);
    if (!v) return false;
    // provided actual numbers, time to draw vector
    drawVector(v, color);
    return true;

}

function clear() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 400, 400);
}