// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_GlobalTranslateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_GlobalTranslateMatrix * u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

const SHAPE_POINT = 0;
const SHAPE_TRIANGLE = 1;
const SHAPE_CIRCLE = 2;

let gl;
let canvas;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_GlobalTranslateMatrix;

let g_rotateMatrix;
let g_translateMatrix;
let g_shapesList = [];
let g_yAngle = -15;
let g_xAngle = -15;


// General animation stats
let fps = 60;
let animating = true;
let start = undefined;
let previousTimestamp = undefined;

// Arm animation stats
let baseArmRotationSpeed = 0.06;
let armRotationLimit = 15;
let elbowRotationLimit = 30;
let fingerRotationLimit = 60;

let leftShoulderGoingDown = true;
let leftElbowGoingDown = true;

let rightShoulderGoingDown = false;
let rightElbowGoingDown = false;

// Finger animation stats
let baseFingerRotationSpeed = 0.12;
let leftFingersGoingUp = [Math.random() > 5, Math.random() > 5, Math.random() > 5];
let rightFingersGoingUp = [Math.random() > 5, Math.random() > 5, Math.random() > 5];

// Leg animation stats
let baseRunSpeed = 0.12;
let hipRotationLimit = 45;
let kneeRotationLimit = 90;

// Right Leg
let rightLegGoingForward = true;
let rightKneeGoingForward = true;

// Left Leg
let leftLegGoingForward = false;
let leftKneeGoingForward = false;

// Arm Dimensions
let armWidth = 0.45;
let armHeight = 0.15;

// Arm Angles
let rightArmAngles = {
  shoulder: 0,
  elbow: {
    x: 0,
    y: 0,
    z: 0,
  },
  fingers: [Math.random() * 60 - 30, Math.random() * 60 - 30, Math.random() * 60 - 30]
};

let leftArmAngles = {
  shoulder: 0,
  elbow: {
    x: 0,
    y: 0,
    z: 0,
  },
  fingers: [Math.random() * 60 - 30, Math.random() * 60 - 30, Math.random() * 60 - 30]
};

// Leg Dimenions
let legWidth = 0.15;
let legDepth = 0.15;
let legHeight = 0.3;

// Leg Angles
let leftLegAngles = {
  hip: 0,
  knee: -45,
}

let rightLegAngles = {
  hip: 0,
  knee: -45,
}

// Claw/Finger Dimensions
let clawHeight = armHeight / 2;
let clawWidth = 0.04;
let clawDepth = 0.09;

// Body Dimensions
let bodyWidth = 0.4;
let bodyHeight = 0.6;
let bodyDepth = 0.5;

// Head Angle
let headAngle = 0;

// Colors
let bodyPurple = [51 / 255, 51 / 255, 204 / 255, 1];
let eye = [179 / 255, 224 / 255, 246, 255];
let centerGem = [202 / 255, 34 / 255, 30 / 255, 1];
let blueGem = [18 / 255, 176 / 255, 227 / 255, 1];
let darkerBlueGem = []

// Camera Control (via mouse)
let prevMouseX = undefined;
let prevMouseY = undefined;
let mouseCameraSpeed = 0.5;

// Vars for the Poke Animation
let baseShoulderSpeed = 2.4;
let baseElbowSpeed = 4.8;
let baseHeadSpeed = 4.8;
let baseKneeSpeed = 2.4;
let baseWaveSpeed = 5;

let raisedShoulder = false;
let raisedElbow = false;
let tiltedElbow = false;
let tiltedHead = false;
let stretchedKnee = false;
let waving = false;
let wavedRight = false;
let wavedLeft = false;
let doneWaving = false;
let shiftPressed = false;

function addOnMouseDrag(element, func) {
  element.dragActive = false;
  element.addEventListener("mouseup", () => { element.dragActive = false });
  element.addEventListener("mousedown", () => { element.dragActive = true });
  element.addEventListener("mousemove", function (e) {
    if (element.dragActive) {
      func(this, e);
    }
  });
}

function resetAnimation(zeroFingers) {
  if (zeroFingers == undefined) zeroFingers = false;
  leftShoulderGoingDown = true;
  leftElbowGoingDown = true;

  rightShoulderGoingDown = false;
  rightElbowGoingDown = false;
  rightLegGoingForward = true;
  rightKneeGoingForward = true;
  leftLegGoingForward = false;
  leftKneeGoingForward = false;

  leftLegAngles = {
    hip: 0,
    knee: -45,
  }

  rightLegAngles = {
    hip: 0,
    knee: -45,
  }

  if (zeroFingers) {
    rightArmAngles = {
      shoulder: 0,
      elbow: {
        x: 0,
        y: 0,
        z: 0,
      },
      fingers: [0, 0, 0]
    };

    leftArmAngles = {
      shoulder: 0,
      elbow: {
        x: 0,
        y: 0,
        z: 0,
      },
      fingers: [0, 0, 0]
    };
  } else {
    rightArmAngles = {
      shoulder: 0,
      elbow: {
        x: 0,
        y: 0,
        z: 0,
      },
      fingers: [Math.random() * 60 - 30, Math.random() * 60 - 30, Math.random() * 60 - 30]
    };

    leftArmAngles = {
      shoulder: 0,
      elbow: {
        x: 0,
        y: 0,
        z: 0,
      },
      fingers: [Math.random() * 60 - 30, Math.random() * 60 - 30, Math.random() * 60 - 30]
    };
  }
  headAngle = 0;

  updateRotationSliders();
  renderScene();
}

function setUpHTMLActions() {
  let ySlider = document.getElementById("yAngle");
  addOnMouseDrag(ySlider, function (elem) {
    g_yAngle = +elem.value;
    renderScene();
  });

  let xSlider = document.getElementById("xAngle");
  addOnMouseDrag(xSlider, function (elem) {
    g_xAngle = +elem.value;
    renderScene();
  });

  let lShoulder = document.getElementById("lShoulder");
  addOnMouseDrag(lShoulder, function (elem) {
    if (waving) return;
    leftArmAngles.shoulder = +elem.value;
    renderScene();
  });

  let lElbow = document.getElementById("lElbow");
  addOnMouseDrag(lElbow, function (elem) {
    if (waving) return;
    leftArmAngles.elbow.x = +elem.value;
    renderScene();
  });

  let lElbowZ = document.getElementById("lElbowZ");
  addOnMouseDrag(lElbowZ, function (elem) {
    if (waving) return;
    leftArmAngles.elbow.z = +elem.value;
    renderScene();
  });

  for (let i = 0; i < 3; i++) {
    let lFinger = document.getElementById("lFinger" + i);
    addOnMouseDrag(lFinger, function (elem) {
      if (waving) return;
      leftArmAngles.fingers[i] = +elem.value;
      renderScene();
    });
  }

  let lHip = document.getElementById("lHip");
  addOnMouseDrag(lHip, function (elem) {
    if (waving) return;
    leftLegAngles.hip = +elem.value;
    renderScene();
  });

  let lKnee = document.getElementById("lKnee");
  addOnMouseDrag(lKnee, function (elem) {
    if (waving) return;
    leftLegAngles.knee = +elem.value;
    renderScene();
  });

  let rShoulder = document.getElementById("rShoulder");
  addOnMouseDrag(rShoulder, function (elem) {
    if (waving) return;
    rightArmAngles.shoulder = +elem.value;
    renderScene();
  });

  let rElbow = document.getElementById("rElbow");
  addOnMouseDrag(rElbow, function (elem) {
    if (waving) return;
    rightArmAngles.elbow.x = +elem.value;
    renderScene();
  });

  let rElbowZ = document.getElementById("rElbowZ");
  addOnMouseDrag(rElbowZ, function (elem) {
    if (waving) return;
    rightArmAngles.elbow.z = +elem.value;
    renderScene();
  });

  for (let i = 0; i < 3; i++) {
    let rFinger = document.getElementById("rFinger" + i);
    addOnMouseDrag(rFinger, function (elem) {
      if (waving) return;
      rightArmAngles.fingers[i] = +elem.value;
      renderScene();
    })
  }

  let rHip = document.getElementById("rHip");
  addOnMouseDrag(rHip, function (elem) {
    if (waving) return;
    rightLegAngles.hip = +elem.value;
    renderScene();
  });

  let rKnee = document.getElementById("rKnee");
  addOnMouseDrag(rKnee, function (elem) {
    if (waving) return;
    rightLegAngles.knee = +elem.value;
    renderScene();
  });

  let head = document.getElementById("head");
  addOnMouseDrag(head, function (elem) {
    if (waving) return;
    headAngle = +head.value;
    renderScene();
  })



  // Buttons
  let stop = document.getElementById("stop");
  stop.addEventListener("click", () => {
    if (waving) return;
    if (animating) {
      animating = false;
      previousTimestamp = undefined;
      fps = 60;
      stop.innerHTML = "Start Animating";

    } else {
      animating = true;
      stop.innerHTML = "Stop Animating";
      requestAnimationFrame(tick);
    }
  });

  let reset = document.getElementById("reset");
  reset.addEventListener("click", () => {
    if (waving) return;
    resetAnimation();
  })


}

function updateRotationSliders() {
  let lShoulder = document.getElementById("lShoulder");
  if (!lShoulder.dragActive) lShoulder.value = leftArmAngles.shoulder;
  let lElbow = document.getElementById("lElbow");
  if (!lElbow.dragActive) lElbow.value = leftArmAngles.elbow.x;
  let lElbowZ = document.getElementById("lElbowZ");
  if (!lElbowZ.dragActive) lElbowZ.value = leftArmAngles.elbow.z;

  for (let i = 0; i < 3; i++) {
    let lFinger = document.getElementById("lFinger" + i);
    if (!lFinger.dragActive) lFinger.value = leftArmAngles.fingers[i];
  }

  if (!lHip.dragActive) lHip.value = leftLegAngles.hip;
  if (!lKnee.dragActive) lKnee.value = leftLegAngles.knee;

  let rShoulder = document.getElementById("rShoulder");
  if (!rShoulder.dragActive) rShoulder.value = rightArmAngles.shoulder;
  let rElbow = document.getElementById("rElbow");
  if (!rElbow.dragActive) rElbow.value = rightArmAngles.elbow.x;
  let rElbowZ = document.getElementById("rElbowZ");
  if (!rElbowZ.dragActive) rElbowZ.value = rightArmAngles.elbow.z;

  for (let i = 0; i < 3; i++) {
    let rFinger = document.getElementById("rFinger" + i);
    if (!rFinger.dragActive) rFinger.value = rightArmAngles.fingers[i];
  }

  if (!rHip.dragActive) rHip.value = rightLegAngles.hip;
  if (!rKnee.dragActive) rKnee.value = rightLegAngles.knee;

  let head = document.getElementById("head");
  if (!head.dragActive)  head.value = headAngle;

}

function setUpWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // This helps alleviate lag
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of the model matrix

  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, "u_GlobalRotateMatrix");
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_GlobalTranslateMatrix = gl.getUniformLocation(gl.program, "u_GlobalTranslateMatrix");
  if (!u_GlobalTranslateMatrix) {
    console.log('Failed to get the storage location of u_GlobalTranslateMatrix');
    return;
  }


}



function clearCanvas(r, g, b, a) {
  // Specify the color for clearing <canvas>
  if (!(r == undefined ||
    g == undefined ||
    b == undefined ||
    a == undefined))
    gl.clearColor(r, g, b, a);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function canvasCoordsToGL(x, y, rect) {
  let newX = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  let newY = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return [newX, newY];
}

function randomColor() {
  return [Math.random(), Math.random(), Math.random(), 1]
}

function main() {
  // Set up website and main canvas
  setUpWebGL();
  setUpHTMLActions();
  connectVariablesToGLSL();
  g_rotateMatrix = new Matrix4();
  g_translateMatrix = new Matrix4();

  canvas.dragActive = false;
  canvas.addEventListener("mouseup", () => {
    canvas.dragActive = false;
    prevMouseX = undefined;
    prevMouseY = undefined;
  });
  canvas.addEventListener("mousedown", function (e)  {
    if (!waving && e.shiftKey) {
      resetAnimation(true);
      requestAnimationFrame(waveAnimation);
      return;
    }
    canvas.dragActive = true
  });
  canvas.addEventListener("mousemove", function (e) {
    // Update Actual Camera
    if (this.dragActive) {
      if (prevMouseX == undefined) {
        prevMouseX = e.x;
        prevMouseY = e.y;
      } else {
        g_yAngle -= mouseCameraSpeed * (e.x - prevMouseX);
        if (g_yAngle < -180) g_yAngle += 360;
        if (g_yAngle > 180) g_yAngle -= 360;
        g_xAngle += mouseCameraSpeed * (prevMouseY - e.y);
        if (g_xAngle < -180) g_xAngle += 360;
        if (g_xAngle > 180) g_xAngle -= 360;
        prevMouseX = e.x;
        prevMouseY = e.y;
      }
      renderScene();
    }

    // Update Camera Slider
    document.getElementById("xAngle").value = g_xAngle;
    document.getElementById("yAngle").value = g_yAngle;
  });

  updateRotationSliders();

  clearCanvas(0, 0, 0, 1);
  resetAnimation();
  // requestAnimationFrame(waveAnimation);
  requestAnimationFrame(tick);

}




function addBody() {
  let M = new Matrix4();

  M.scale(bodyWidth, bodyHeight, bodyDepth);
  g_shapesList.push(new Cube(bodyPurple, M));
}

function addLeftArm() {
  let M = new Matrix4();

  // First half (connecting to body)
  M.translate(bodyWidth / 2 - armWidth * .25, 0, 0);
  M.rotate(leftArmAngles.shoulder, 0, 0, 1);
  M.translate(armWidth / 2, 0, 0);
  let M2 = new Matrix4(M);
  M.scale(armWidth * 1.25, armHeight, 0.15);
  g_shapesList.push(new Cube(bodyPurple, M));


  // Second half (connecting to elbow)
  // Translate further to where this needs to be
  M2.translate(armWidth * 1.25 / 2, 0, 0);
  // Rotate
  M2.rotate(leftArmAngles.elbow.z, 0, 0, 1);
  M2.rotate(leftArmAngles.elbow.y, 0, 1, 0);
  M2.rotate(leftArmAngles.elbow.x, 1, 0, 0);
  // Go to pivot point
  M2.translate(0, 0, -armWidth / 2 + 0.15 / 2);
  // Save state
  let M3 = new Matrix4(M2);
  M2.scale(armHeight, armHeight + 0.01, armWidth + 0.01);
  g_shapesList.push(new Cube(bodyPurple, M2));

  // Left Claws
  // Claw 1
  // Move to new location
  let M4 = new Matrix4(M3);
  M3.translate(0, armHeight / 2 - clawHeight / 2,
    -armWidth / 2 + clawDepth / 1.75);
  // Rotate
  M3.rotate(leftArmAngles.fingers[0], 1, 0, 0);
  // Move claw to pivot point
  M3.translate(0, 0, - clawDepth);
  // Scale
  M3.scale(clawWidth, clawHeight, clawDepth);
  g_shapesList.push(new Cube(bodyPurple, M3));


  // Claw 2
  M3 = new Matrix4(M4);
  M3.translate(-armHeight / 2 + clawWidth / 2,
    armHeight / 2 - clawHeight / 2,
    -armWidth / 2 + clawDepth / 1.75);
  // Rotate
  M3.rotate(leftArmAngles.fingers[1], 1, 0, 0);
  // Move claw to pivot point
  M3.translate(0, 0, - clawDepth);
  // Scale
  M3.scale(clawWidth, clawHeight, clawDepth);
  g_shapesList.push(new Cube(bodyPurple, M3));

  // Claw 3
  M3 = new Matrix4(M4);
  M3.translate(armHeight / 2 - clawWidth / 2,
    armHeight / 2 - clawHeight / 2,
    -armWidth / 2 + clawDepth / 1.75);
  // Rotate
  M3.rotate(leftArmAngles.fingers[2], 1, 0, 0);
  // Move claw to pivot point
  M3.translate(0, 0, - clawDepth);
  // Scale
  M3.scale(clawWidth, clawHeight, clawDepth);
  g_shapesList.push(new Cube(bodyPurple, M3));

}

function addRightArm() {
  let M = new Matrix4();

  // First half (connecting to body)
  M.translate(-bodyWidth / 2 + armWidth * .25, 0, 0);
  M.rotate(rightArmAngles.shoulder, 0, 0, 1);
  M.translate(-armWidth / 2, 0, 0);
  let M2 = new Matrix4(M);
  M.scale(armWidth * 1.25, armHeight, 0.15);
  g_shapesList.push(new Cube(bodyPurple, M));


  // Second half (connecting to elbow)
  // Translate further to where this needs to be
  M2.translate(-armWidth * 1.25 / 2, 0, 0);
  // Rotate
  M2.rotate(rightArmAngles.elbow.z, 0, 0, 1);
  M2.rotate(rightArmAngles.elbow.y, 0, 1, 0);
  M2.rotate(rightArmAngles.elbow.x, 1, 0, 0);
  // Go to pivot point
  M2.translate(0, 0, -armWidth / 2 + 0.15 / 2);
  // Save state
  let M3 = new Matrix4(M2);
  M2.scale(armHeight, armHeight + 0.01, armWidth + 0.01);
  g_shapesList.push(new Cube(bodyPurple, M2));

  // Left Claws
  // Claw 1
  // Move to new location
  let M4 = new Matrix4(M3);
  M3.translate(0, armHeight / 2 - clawHeight / 2,
    -armWidth / 2 + clawDepth / 1.75);
  // Rotate
  M3.rotate(rightArmAngles.fingers[0], 1, 0, 0);
  // Move claw to pivot point
  M3.translate(0, 0, - clawDepth);
  // Scale
  M3.scale(clawWidth, clawHeight, clawDepth);
  g_shapesList.push(new Cube(bodyPurple, M3));


  // Claw 2
  M3 = new Matrix4(M4);
  M3.translate(armHeight / 2 - clawWidth / 2,
    armHeight / 2 - clawHeight / 2,
    -armWidth / 2 + clawDepth / 1.75);
  // Rotate
  M3.rotate(rightArmAngles.fingers[1], 1, 0, 0);
  // Move claw to pivot point
  M3.translate(0, 0, - clawDepth);
  // Scale
  M3.scale(clawWidth, clawHeight, clawDepth);
  g_shapesList.push(new Cube(bodyPurple, M3));

  // Claw 3
  M3 = new Matrix4(M4);
  M3.translate(-armHeight / 2 + clawWidth / 2,
    armHeight / 2 - clawHeight / 2,
    -armWidth / 2 + clawDepth / 1.75);
  // Rotate
  M3.rotate(rightArmAngles.fingers[2], 1, 0, 0);
  // Move claw to pivot point
  M3.translate(0, 0, - clawDepth);
  // Scale
  M3.scale(clawWidth, clawHeight, clawDepth);
  g_shapesList.push(new Cube(bodyPurple, M3));

}

function addCenterGem() {
  let n_sides = 6;
  let angle = 90;
  let points = [];
  let inc = 360 / (n_sides);
  for (let i = 0; i < n_sides; i++) {
    let z = Math.sin(angle / 180 * Math.PI) * 0.5;
    let x = Math.cos(angle / 180 * Math.PI) * 0.5;
    let point = new Point3D(x, 0, z);
    points.push(point);
    angle += inc;
  }
  let M = new Matrix4();
  M.translate(0, 0, -bodyWidth / 2 - 0.05);
  M.scale(0.15, 0.25, 0.02);
  M.rotate(90, 1, 0, 0);
  g_shapesList.push(new Prism(points, 1, centerGem, M));

}

function addBackGems() {
  let n_sides = 6;
  let angle = 90;
  let points = [];
  let inc = 360 / (n_sides);
  for (let i = 0; i < n_sides; i++) {
    let z = Math.sin(angle / 180 * Math.PI) * 0.5;
    let x = Math.cos(angle / 180 * Math.PI) * 0.5;
    let point = new Point3D(x, 0, z);
    points.push(point);
    angle += inc;
  }
  let M = new Matrix4();
  M.translate(bodyWidth / 5, bodyHeight / 5, bodyWidth / 2 + 0.05);
  M.scale(0.15, 0.15, 0.02);
  M.rotate(90, 1, 0, 0);
  g_shapesList.push(new Prism(points, 1, centerGem, M));

  M = new Matrix4();
  M.translate(-bodyWidth / 5, 0, bodyWidth / 2 + 0.05);
  M.scale(0.07, 0.15, 0.02);
  M.rotate(20, 0, 0, 1);
  M.rotate(90, 1, 0, 0);
  g_shapesList.push(new Prism(points, 1, blueGem, M));

  M = new Matrix4();
  M.translate(bodyWidth / 8, -bodyHeight / 5, bodyWidth / 2 + 0.05);
  M.scale(0.15, 0.07, 0.02);
  M.rotate(20, 0, 0, 1);
  M.rotate(90, 1, 0, 0);
  g_shapesList.push(new Prism(points, 1, blueGem, M));

}

function addLeftLeg() {
  let M = new Matrix4();
  // Top half
  M.rotate(leftLegAngles.hip, 1, 0, 0);
  M.translate(bodyWidth / 2 - legWidth / 2 - 0.01, -bodyHeight / 2 - legHeight / 2, 0);
  let M2 = new Matrix4(M);
  M.scale(legWidth, legHeight, legDepth);
  g_shapesList.push(new Cube(bodyPurple, M));

  // Bottom Half
  M = new Matrix4(M2);

  M.translate(0, -legHeight / 2, 0);
  M.rotate(leftLegAngles.knee, 1, 0, 0);
  M.translate(0, -legHeight / 2 + 0.074, 0);
  M.scale(legWidth, legHeight, legDepth);
  g_shapesList.push(new Cube(bodyPurple, M));
}

function addRightLeg() {
  let M = new Matrix4();
  // Top half
  M.rotate(rightLegAngles.hip, 1, 0, 0);
  M.translate(-bodyWidth / 2 + legWidth / 2 + 0.01, -bodyHeight / 2 - legHeight / 2, 0);
  let M2 = new Matrix4(M);
  M.scale(legWidth, legHeight, legDepth);
  g_shapesList.push(new Cube(bodyPurple, M));

  // Bottom Half
  M = new Matrix4(M2);

  M.translate(0, -legHeight / 2, 0);
  M.rotate(rightLegAngles.knee, 1, 0, 0);
  M.translate(0, -legHeight / 2 + 0.074, 0);
  M.scale(legWidth, legHeight, legDepth);
  g_shapesList.push(new Cube(bodyPurple, M));
}

function addEyes(M) {
  // Right Eye
  let n_sides = 6;
  let angle = 90;
  let points = [];
  let inc = 360 / (n_sides);
  for (let i = 0; i < n_sides; i++) {
    let z = Math.sin(angle / 180 * Math.PI) * 0.5;
    let x = Math.cos(angle / 180 * Math.PI) * 0.5;
    let point = new Point3D(x, 0, z);
    points.push(point);
    angle += inc;
  }

  if (M == undefined) M = new Matrix4();
  let M2 = new Matrix4(M);
  M2.translate(0.175, 0, -0.15);
  M2.rotate(90, 1, 0, 0);
  M2.scale(0.25, 0.25, 0.22);

  g_shapesList.push(new Prism(points, 1, eye, M2));


  // Left Eye
  M2 = new Matrix4(M);
  M2.translate(-0.175, 0, -0.15);
  M2.rotate(90, 1, 0, 0);
  M2.scale(0.25, 0.25, 0.22);

  g_shapesList.push(new Prism(points, 1, eye, M2));
}

function addEars(M) {
  // Right Ear
  let points = [
    new Point3D(-0.5, 0, -0.5),
    new Point3D(0.5, 0, -0.5),
    new Point3D(-0.5, 0, 0.5)
  ];

  if (M == undefined) M = new Matrix4();
  let M2 = new Matrix4(M);
  M2.translate(-0.2, (0.75 * 0.8) / 2, 0);
  M2.scale(0.25, 0.25, bodyDepth);
  M2.rotate(-90, 1, 0, 0);
  g_shapesList.push(new Prism(points, 1, bodyPurple, M2));

  M2 = new Matrix4(M);
  M2.translate(-0.3, -0.03 + (0.75 * 0.8) / 2, 0);
  M2.scale(0.25, 0.25, bodyDepth);
  M2.rotate(30, 0, 0, 1);
  M2.rotate(-90, 1, 0, 0);
  g_shapesList.push(new Prism(points, 1, bodyPurple, M2));

  // Left Ear
  M2 = new Matrix4(M);
  M2.translate(0.2, (0.75 * 0.8) / 2, -0.005);
  M2.scale(-0.25, 0.25, bodyDepth);
  M2.rotate(-90, 1, 0, 0);
  g_shapesList.push(new Prism(points, 1, bodyPurple, M2));

  M2 = new Matrix4(M);
  M2.translate(0.3, -0.03 + (0.75 * 0.8) / 2, -0.005);
  M2.scale(-0.25, 0.25, bodyDepth);
  M2.rotate(30, 0, 0, 1);
  M2.rotate(-90, 1, 0, 0);
  g_shapesList.push(new Prism(points, 1, bodyPurple, M2));

}

function addHead() {
  let n_sides = 6;
  let angle = 90;
  let points = [];
  let inc = 360 / (n_sides);
  for (let i = 0; i < n_sides; i++) {
    let z = Math.sin(angle / 180 * Math.PI) * 0.5;
    let x = Math.cos(angle / 180 * Math.PI) * 0.5;
    let point = new Point3D(x, 0, z);
    points.push(point);
    angle += inc;
  }
  let M = new Matrix4();
  M.translate(0, bodyHeight - 0.1, 0);
  M.rotate(headAngle, 0, 0, 1);
  let M2 = new Matrix4(M);
  M.scale(0.8, 0.75 * 0.8, bodyDepth + 0.01);
  M.rotate(-90, 1, 0, 0);
  g_shapesList.push(new Prism(points, 1, bodyPurple, M));

  addEyes(M2);
  addEars(M2);
}



function addSableye() {
  addBody();
  addLeftArm();
  addRightArm();
  addCenterGem();
  addLeftLeg();
  addRightLeg();
  addHead();
  addBackGems();

}

function renderScene() {
  clearCanvas();
  g_shapesList = []
  addSableye();
  g_rotateMatrix.setRotate(g_yAngle, 0, 1, 0);
  g_rotateMatrix.rotate(g_xAngle, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, g_rotateMatrix.elements);
  gl.uniformMatrix4fv(u_GlobalTranslateMatrix, false, g_translateMatrix.elements);
  
  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    let shape = g_shapesList[i];
    shape.render();
  }
}

function tick() {
  if (waving) {
    resetAnimation(true);
    return;
  }
  if (previousTimestamp == undefined) {
    previousTimestamp = performance.now();
    start = previousTimestamp;
  } else {
    let timeElapsed = (performance.now() - previousTimestamp) / 1000;
    fps = 1 / timeElapsed;
    previousTimestamp = performance.now();
    // Every tenth of a second, update fps counter
    if (previousTimestamp - start > 100) {
      document.getElementById("fps").innerHTML = "FPS: " + Math.round(fps);
      start = previousTimestamp;
    }
  }

  // Do changes
  let armRotationSpeed = Math.min(baseArmRotationSpeed * 60 / fps, baseArmRotationSpeed * 6);
  let fingerRotationSpeed = Math.min(baseFingerRotationSpeed * 60 / fps, baseArmRotationSpeed * 6);
  let runSpeed = Math.min(baseRunSpeed * 60 / fps, baseRunSpeed * 6);

  // Finger Movements
  for (let i = 0; i < 3; i++) {
    // Left Fingers
    if (leftFingersGoingUp[i]) {
      if (leftArmAngles.fingers[i] < fingerRotationLimit) {
        leftArmAngles.fingers[i] += fingerRotationSpeed * (fingerRotationLimit - Math.abs(leftArmAngles.fingers[i]) + fingerRotationLimit / 3);
      } else {
        leftFingersGoingUp[i] = false;
      }
    } else {
      if (leftArmAngles.fingers[i] > -fingerRotationLimit) {
        leftArmAngles.fingers[i] -= fingerRotationSpeed * (fingerRotationLimit - Math.abs(leftArmAngles.fingers[i]) + fingerRotationLimit / 3);
      } else {
        leftFingersGoingUp[i] = true;
      }
    }

    // Right Fingers
    if (rightFingersGoingUp[i]) {
      if (rightArmAngles.fingers[i] < fingerRotationLimit) {
        rightArmAngles.fingers[i] += fingerRotationSpeed * (fingerRotationLimit - Math.abs(rightArmAngles.fingers[i]) + fingerRotationLimit / 3);
      } else {
        rightFingersGoingUp[i] = false;
      }
    } else {
      if (rightArmAngles.fingers[i] > -fingerRotationLimit) {
        rightArmAngles.fingers[i] -= fingerRotationSpeed * (fingerRotationLimit - Math.abs(rightArmAngles.fingers[i]) + fingerRotationLimit / 3);
      } else {
        rightFingersGoingUp[i] = true;
      }
    }
  }

  // Left Arm Movements
  if (leftShoulderGoingDown) {
    if (leftArmAngles.shoulder > -armRotationLimit) {
      leftArmAngles.shoulder -= armRotationSpeed * (armRotationLimit - Math.abs(leftArmAngles.shoulder) + armRotationLimit / 3);
    } else {
      leftShoulderGoingDown = !leftShoulderGoingDown;
    }
  } else {
    if (leftArmAngles.shoulder < armRotationLimit) {
      leftArmAngles.shoulder += armRotationSpeed * (armRotationLimit - Math.abs(leftArmAngles.shoulder) + armRotationLimit / 3);
    } else {
      leftShoulderGoingDown = !leftShoulderGoingDown;
    }
  }

  if (leftElbowGoingDown) {
    if (leftArmAngles.elbow.x > -elbowRotationLimit) {
      leftArmAngles.elbow.x -= armRotationSpeed * (elbowRotationLimit - Math.abs(leftArmAngles.elbow.x) + elbowRotationLimit / 3);
    } else {
      leftElbowGoingDown = !leftElbowGoingDown;
    }
  } else {
    if (leftArmAngles.elbow.x < elbowRotationLimit) {
      leftArmAngles.elbow.x += armRotationSpeed * (elbowRotationLimit - Math.abs(leftArmAngles.elbow.x) + elbowRotationLimit / 3);
    } else {
      leftElbowGoingDown = !leftElbowGoingDown;
    }
  }

  // Right Arm Movements
  if (rightShoulderGoingDown) {
    if (rightArmAngles.shoulder < armRotationLimit) {
      rightArmAngles.shoulder += armRotationSpeed * (armRotationLimit - Math.abs(rightArmAngles.shoulder) + armRotationLimit / 3);
    } else {
      rightShoulderGoingDown = !rightShoulderGoingDown;
    }
  } else {
    if (rightArmAngles.shoulder > -armRotationLimit) {
      rightArmAngles.shoulder -= armRotationSpeed * (armRotationLimit - Math.abs(rightArmAngles.shoulder) + armRotationLimit / 3);
    } else {
      rightShoulderGoingDown = !rightShoulderGoingDown;
    }
  }


  if (rightElbowGoingDown) {
    if (rightArmAngles.elbow.x > -elbowRotationLimit) {
      rightArmAngles.elbow.x -= armRotationSpeed * (elbowRotationLimit - Math.abs(rightArmAngles.elbow.x) + elbowRotationLimit / 3);
    } else {
      rightElbowGoingDown = !rightElbowGoingDown;
    }
  } else {
    if (rightArmAngles.elbow.x < elbowRotationLimit) {
      rightArmAngles.elbow.x += armRotationSpeed * (elbowRotationLimit - Math.abs(rightArmAngles.elbow.x) + elbowRotationLimit / 3);
    } else {
      rightElbowGoingDown = !rightElbowGoingDown;
    }
  }

  // Leg Movements

  // Right Leg
  if (rightLegGoingForward) {
    if (rightLegAngles.hip < hipRotationLimit) {
      rightLegAngles.hip += runSpeed * (hipRotationLimit - Math.abs(rightLegAngles.hip) + hipRotationLimit / 3);
    } else {
      rightLegGoingForward = false;
    }
  }
  else {
    if (rightLegAngles.hip > -hipRotationLimit) {
      rightLegAngles.hip -= runSpeed * (hipRotationLimit - Math.abs(rightLegAngles.hip) + hipRotationLimit / 3);
    } else {
      rightLegGoingForward = true;
    }
  }

  // Right Knee
  // if (rightKneeGoingForward) {
  //   if (rightLegAngles.knee < 0) {
  //     rightLegAngles.knee += runSpeed * (kneeRotationLimit / 2 - Math.abs(Math.abs(rightLegAngles.knee) - kneeRotationLimit / 2) + kneeRotationLimit / 6);

  //   } else {
  //     rightKneeGoingForward = false;
  //   }
  // }
  // else {
  //   if (rightLegAngles.knee > -kneeRotationLimit) {
  //     rightLegAngles.knee -= runSpeed * (kneeRotationLimit / 2 - Math.abs(Math.abs(rightLegAngles.knee) - kneeRotationLimit / 2) + kneeRotationLimit / 6);
  //   } else {
  //     rightKneeGoingForward = true;
  //   }
  // }

  // Left Leg
  if (leftLegGoingForward) {
    if (leftLegAngles.hip < hipRotationLimit) {
      leftLegAngles.hip += runSpeed * (hipRotationLimit - Math.abs(leftLegAngles.hip) + hipRotationLimit / 3);
    } else {
      leftLegGoingForward = false;
    }
  }
  else {
    if (leftLegAngles.hip > -hipRotationLimit) {
      leftLegAngles.hip -= runSpeed * (hipRotationLimit - Math.abs(leftLegAngles.hip) + hipRotationLimit / 3);
    } else {
      leftLegGoingForward = true;
    }
  }

  // Left Knee
  // if (leftKneeGoingForward) {
  //   if (leftLegAngles.knee < 0) {
  //     leftLegAngles.knee += runSpeed * (kneeRotationLimit / 2 - Math.abs(Math.abs(leftLegAngles.knee) - kneeRotationLimit / 2) + kneeRotationLimit / 6);

  //   } else {
  //     leftKneeGoingForward = false;
  //   }
  // }
  // else {
  //   if (leftLegAngles.knee > -kneeRotationLimit) {
  //     leftLegAngles.knee -= runSpeed * (kneeRotationLimit / 2 - Math.abs(Math.abs(leftLegAngles.knee) - kneeRotationLimit / 2) + kneeRotationLimit / 6);
  //   } else {
  //     leftKneeGoingForward = true;
  //   }
  // }
  leftLegAngles.knee = leftLegAngles.hip - 45;
  rightLegAngles.knee = rightLegAngles.hip - 45;


  updateRotationSliders();
  renderScene();
  if (animating) {
    requestAnimationFrame(tick);
  }
}

function resetWavingVariables() {
  raisedShoulder = false;
  raisedElbow = false;
  tiltedElbow = false;
  tiltedHead = false;
  stretchedKnee = false;
  waving = false;
  wavedRight = false;
  wavedLeft = false;
  doneWaving = false;
}



function waveAnimation(timeStamp) {
  waving = true;
  // Set up time an calculate fps
  if (previousTimestamp == undefined) {
    previousTimestamp = performance.now();
    start = previousTimestamp;
  } else {
    let timeElapsed = (performance.now() - previousTimestamp) / 1000;
    fps = 1 / timeElapsed;
    previousTimestamp = performance.now();
    // Every tenth of a second, update fps counter
    if (previousTimestamp - start > 100) {
      document.getElementById("fps").innerHTML = "FPS: " + Math.round(fps);
      start = previousTimestamp;
    }
  }

  let shoulderSpeed = Math.min(baseShoulderSpeed * 60 / fps, baseShoulderSpeed * 6);
  let elbowSpeed = Math.min(baseElbowSpeed * 60 / fps, baseElbowSpeed * 6);
  let headSpeed = Math.min(baseHeadSpeed * 60 / fps, baseHeadSpeed * 6);
  let kneeSpeed = Math.min(baseKneeSpeed * 60 / fps, baseKneeSpeed * 6);
  let waveSpeed = Math.min(baseWaveSpeed * 60 / fps, baseWaveSpeed * 6);
  // Start moving arm

  // Raising shoulder
  if (leftArmAngles.shoulder < 30) {
    leftArmAngles.shoulder += shoulderSpeed;
    rightArmAngles.shoulder += shoulderSpeed;
  } else {
    raisedShoulder = true;
  }

  // Tilting arm
  if (leftArmAngles.elbow.x < 90) {
    leftArmAngles.elbow.x += elbowSpeed;
    rightArmAngles.elbow.x -= elbowSpeed;
  } else {
    raisedElbow = true;
  }

  if (!tiltedElbow && leftArmAngles.elbow.z > -30) {
    leftArmAngles.elbow.z -= elbowSpeed;
    rightArmAngles.elbow.z -= elbowSpeed;
  } else {
    tiltedElbow = true;
  }

  // Stretch legs
  if (leftLegAngles.knee < 0) {
    leftLegAngles.knee += kneeSpeed;
    rightLegAngles.knee += kneeSpeed;
  } else {
    stretchedKnee = true;
  }

  // Tilt Head
  if (headAngle < 30) {
    headAngle += headSpeed;
  } else {
    tiltedHead = true;
  }

  // Wait for set up, then wave hand
  if (stretchedKnee && raisedShoulder && raisedElbow && tiltedElbow && tiltedHead && !wavedLeft) {
    if (!wavedRight) {
      if (leftArmAngles.elbow.z < 2.5) {
        leftArmAngles.elbow.z += waveSpeed;
      } else {
        wavedRight = true;
      }
    } else {
      if (leftArmAngles.elbow.z > -60) {
        leftArmAngles.elbow.z -= waveSpeed;
      } else {
        wavedLeft = true;
        setTimeout(() => { doneWaving = true }, 500);
      }
    }
  }


  renderScene();

  if (!doneWaving) {
    updateRotationSliders();
    requestAnimationFrame(waveAnimation);
  } else {
    resetAnimation();
    resetWavingVariables();
    updateRotationSliders();
    requestAnimationFrame(tick);
  }
}
