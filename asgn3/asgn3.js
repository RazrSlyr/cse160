// Taken from
// https://github.com/mrdoob/stats.js/
// used for FPS reader
function setupStats() { var script = document.createElement('script'); script.onload = function () { var stats = new Stats(); document.body.appendChild(stats.dom); requestAnimationFrame(function loop() { stats.update(); requestAnimationFrame(loop) }); }; script.src = 'https://mrdoob.github.io/stats.js/build/stats.min.js'; document.head.appendChild(script); }
setupStats();

// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  // Sampler for texture
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform int u_WhichTexture;
  void main() {
    // gl_FragColor = u_FragColor;
    if (u_WhichTexture == -1) {
      gl_FragColor = u_FragColor;
    } else if (u_WhichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_WhichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_WhichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if (u_WhichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else {
      gl_FragColor = vec4(1, 0, 1, 1);
    }
  }`;

const SHAPE_POINT = 0;
const SHAPE_TRIANGLE = 1;
const SHAPE_CIRCLE = 2;

let gl;
let canvas;
let a_Position;
let a_UV;
let u_FragColor;

let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;

let u_Samplers = [];
let n_textures = 4;
let u_WhichTexture;

let g_rotateMatrix;
let g_translateMatrix;
let g_shapesList = [];
let g_yAngle = 0;
let g_xAngle = 0;
let gl_TEXTURES;

const TEXTURES = ["./img/uvCoords.png", "./img/dirt.png", "./img/ground.png", "./img/star.png"]





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
  gl_TEXTURES = [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3]
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

  a_UV = gl.getAttribLocation(gl.program, "a_UV");
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
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

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  // Get pointer to u_Sampler
  for (let i = 0; i < n_textures; i++) {
    let u_Sampler = gl.getUniformLocation(gl.program, `u_Sampler${i}`);
    if (!u_Sampler) {
      console.error(`Failed to get the storage location of u_Sampler${i}`);
      return -1;
    }
    u_Samplers.push(u_Sampler);
  }

  u_WhichTexture = gl.getUniformLocation(gl.program, "u_WhichTexture");
  if (!u_WhichTexture) {
    console.error('Failed to get the storage location of u_WhichTexture');
    return -1;
  }


}

function loadTexture(image, texNum) {
  let texture = gl.createTexture();
  if (!texture) {
    console.error("Failed to create texture");
    return -1;
  }

  // Flip the image's y axis
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl_TEXTURES[texNum]);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Samplers[texNum], texNum);

  // gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

  // gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
  // Textures loaded
}

function initTextures() {

  for (let i = 0; i < TEXTURES.length; i++) {
    let img = new Image();
    if (!img) {
      console.error(`Failed to create image for texture ${i}`);
    }
    img.src = TEXTURES[i];
    img.onload = () => {
      loadTexture(img, i);
    }
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

let speed = 0.025;
let rotate_speed = 0.125 / 16;


let camera = new Camera(speed, rotate_speed);

function rotateRight(forward, distance, right, left) {
  // get rotation direction
  if (left !== undefined) right.mul(-1);
  let direction = right.sub(forward).normalize();
  console.log(direction.elements);
  // set new forward
  forward.add(direction.mul(rotate_speed)).normalize();
  // set new look at direction
  g_at = (new Vector3()).set(g_eye).add(forward.mul(distance));
}

function keydown(event) {
  // Movement 
  if (event.keyCode === 87) { // w pressed
    camera.move[2] = 1;
  } else if (event.keyCode === 83) { // s pressed
    camera.move[2] = -1;
  } else if (event.keyCode === 68) { // d pressed
    camera.move[0] = 1;
  } else if (event.keyCode === 65) { // a pressed
    camera.move[0] = -1;
  }
}

function keyup(event) {
  if (event.keyCode === 68 && camera.move[0] === 1) { // d released and moving to the right
    camera.move[0] = 0;
  } else if (event.keyCode === 65 && camera.move[0] === -1) { // a released and moving to the left
    camera.move[0] = 0;
  } else if (event.keyCode === 87 && camera.move[2] === 1) { // w released and moving to the right
    camera.move[2] = 0;
  } else if (event.keyCode === 83 && camera.move[2] === -1) { // s released and moving to the right
    camera.move[2] = 0;
  }
}

// Mouse capture/rotation info
let locked = false;
let oldX = null;
let oldY = null;
// Rotation on the Y-axis
let rotateY = 0;
// Rotation on the X-axis
let rotateX = 0;
let sableye = null;


function main() {
  // Set up website and main canvas
  setUpWebGL();
  connectVariablesToGLSL();
  initTextures();
  g_rotateMatrix = new Matrix4();
  g_translateMatrix = new Matrix4();

  // Make Sableye
  let M = new Matrix4();
  M.translate(0.5, 0, -1);
  M.scale(0.5, 0.5, 0.5);
  sableye = new Sableye(M);

  document.onkeydown = keydown;
  document.onkeyup = keyup;

  canvas.addEventListener("click", async () => {
    await canvas.requestPointerLock({
      unadjustedMovement: true,
    });
  });

  document.addEventListener("pointerlockchange", (event) => {
    locked = !locked;
  })

  document.addEventListener("mousemove", (event) => {
    if (!locked) return;
    let x = event.clientX;
    let y = event.clientY;
    rotateY += event.movementX;
    rotateX -= event.movementY;
  })

  // Mouse rotate
  clearCanvas(0, 0, 0, 1);

  tick();

}

function tick() {
  camera.rotate[1] = rotateY;
  camera.rotate[0] = rotateX;
  camera.update();
  rotateY = 0;
  rotateX = 0;
  renderScene();
  requestAnimationFrame(tick);
}


let cubes = null;
let world_width = 8;
let world_depth = 8;
const BLOCK = 0;
const CRYSTAL = 0;
let map = [
  [[BLOCK, 2], [BLOCK, 2], [BLOCK, 2], [BLOCK, 2], [BLOCK, 2], [BLOCK, 2], [BLOCK, 2], [BLOCK, 2]],
  [[BLOCK, 2], 0, [BLOCK, 1], 0, 0, 0, 0, [BLOCK, 2]],
  [[BLOCK, 2], 0, 0, [BLOCK, 1], 0, [BLOCK, 1], 0, [BLOCK, 2]],
  [[BLOCK, 2], 0, [BLOCK, 1], 0, 0, [BLOCK, 1], 0, [BLOCK, 2]],
  [[BLOCK, 2], 0, 0, 0, 0, 0, 0, [BLOCK, 2]],
  [[BLOCK, 2], 0, [BLOCK, 1], 0, [BLOCK, 1], 0, 0, [BLOCK, 2]],
  [[BLOCK, 2], 0, 0, [BLOCK, 1], 0, 0, 0, [BLOCK, 2]],
  [[BLOCK, 2], [BLOCK, 2], [BLOCK, 2], [BLOCK, 2], [BLOCK, 2], [BLOCK, 2], [BLOCK, 2], [BLOCK, 2]],
];

function buildCubes() {
  cubes = [];
  for (let i = 0; i < world_width; i++) {
    for (let j = 0; j < world_depth; j++) {
      if (map[i][j] === 0) continue;
      let z = i - 4 + 0.5;
      let x = j - 4 + 0.5;
      for (let k = 0; k < map[i][j][1]; k++) {
        if (map[i][j][0] === BLOCK) {
          let y = k;
          let M = new Matrix4();
          M.translate(x, y, z);
          let cube = new Cube([1, 0, 0, 1], M, 1);
          cubes.push(cube);
        }
      }

    }
  }
}





function renderScene() {
  clearCanvas();
  if (cubes === null) {
    buildCubes();
  }
  g_shapesList = cubes.slice();
  g_shapesList.push(sableye);

  // Ground
  M = new Matrix4();
  M.translate(0, -0.55, 0);
  M.scale(100, 0.1, 100);
  g_shapesList.push(new Cube([1, 0, 0, 1], M, 2));

  // Skybox 
  M = new Matrix4();
  M.translate(0, 0, 0);
  M.scale(100, 100, 100);
  g_shapesList.push(new Cube([1, 0, 0, 1], M, 3));


  g_rotateMatrix.setRotate(g_yAngle, 0, 1, 0);
  g_rotateMatrix.rotate(g_xAngle, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, g_rotateMatrix.elements);
  let projMat = new Matrix4();

  // First Arg: FOV
  // Second Arg: Aspect Ratio
  // Third Arg: Near Plane Clipping
  // Fourth Arg: Far Plane Clipping
  projMat.setPerspective(60, canvas.width / canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
  let viewMat = new Matrix4();
  // First Three Numbers: Where we are 
  // Second Three Numbers: Where are we looking at
  // Last Three Numbers: What direction is "up" relative to us
  viewMat.setLookAt(camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2],
    camera.at.elements[0], camera.at.elements[1], camera.at.elements[2],
    camera.up.elements[0], camera.up.elements[1], camera.up.elements[2]);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);


  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    let shape = g_shapesList[i];
    shape.render();
  }
}