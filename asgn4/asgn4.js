// Taken from
// https://github.com/mrdoob/stats.js/
// used for FPS reader
let stats;
function setupStats() { var script = document.createElement('script'); script.onload = function () { var stats = new Stats(); document.body.appendChild(stats.dom); requestAnimationFrame(function loop() { stats.update(); requestAnimationFrame(loop) }); }; script.src = 'https://mrdoob.github.io/stats.js/build/stats.min.js'; document.head.appendChild(script); }
setupStats();

// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec4 a_Color;
  attribute vec4 a_Normal;

  varying vec3 v_Normal;
  varying vec2 v_UV;
  varying vec4 v_Color;
  varying vec4 v_VertPos;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_NormalMatrix;



  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Color = a_Color;
    v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
    v_VertPos = u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec4 v_Color;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;

  uniform vec4 u_FragColor;
  // Sampler for texture
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform sampler2D u_Sampler5;
  uniform int u_WhichTexture;

  // Lighting uniforms
  uniform vec3 u_LightPos;
  uniform vec3 u_CameraPos;
  uniform vec3 u_DiffuseColor;
  uniform vec3 u_AmbColor;
  uniform vec3 u_SpecColor;
  uniform vec3 u_LightColor;
  uniform int u_Disable;
  uniform int u_ShowNorms;

  void main() {
    //gl_FragColor = u_FragColor;
    
    if (u_ShowNorms == 1) {
      gl_FragColor = vec4(v_Normal, 1.0);
    } else if (u_WhichTexture == -2) { // use varying color (currently only for heightmap)
      gl_FragColor = v_Color;
    } else if (u_WhichTexture == -1) {
      gl_FragColor = u_FragColor;
    } else if (u_WhichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_WhichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_WhichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if (u_WhichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
      // This one is the background, no lighting needed
      return;
    } else if (u_WhichTexture == 4) {
      gl_FragColor = vec4(texture2D(u_Sampler4, v_UV).rgb, 0.5);
    } else {
      // Converts UV to color, used for debugging
      gl_FragColor = vec4(v_UV.x, (v_UV.x + v_UV.y) / 2.0, v_UV.y, 1.0);
      return;
    }

    if (u_Disable == 1) {
      return;
    }

    // Lighting
    vec3 lightVector = u_LightPos - vec3(v_VertPos);
    float r = length(lightVector);

    // check if you're the light (or right next to it)
    if (r < 5.0) {
      return;
    }

    // N dot L (for diffuse lighting)
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N, L), 0.0);
    vec3 diffuse = vec3(gl_FragColor) * nDotL * u_DiffuseColor * u_LightColor;

    // Ambient
    vec3 ambient = vec3(gl_FragColor) * u_AmbColor * u_LightColor;

    // Specular
    float specCoef = 100.0;
    vec3 R = reflect(-L, N);
    vec3 E = normalize(u_CameraPos - vec3(v_VertPos));
    vec3 specular = vec3(gl_FragColor) * u_SpecColor * pow(max(dot(E, R), 0.0), specCoef) * u_LightColor;

    gl_FragColor = vec4(diffuse + ambient + specular, gl_FragColor.a);

  }`;

const SHAPE_POINT = 0;
const SHAPE_TRIANGLE = 1;
const SHAPE_CIRCLE = 2;

let gl;
let canvas;
let a_Position;
let a_UV;
let a_Color;
let u_FragColor;
let a_Normal;

let u_ModelMatrix;
let u_NormalMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_LightPos;
let u_CameraPos;
let u_Disable;
let u_DiffuseColor;
let u_AmbColor;
let u_SpecColor;
let u_ShowNorms;
let u_LightColor;


let u_Samplers = [];
let n_textures = 5;
let u_WhichTexture;

let g_rotateMatrix;
let g_translateMatrix;
let g_shapesList = [];
let g_yAngle = 0;
let g_xAngle = 0;
let gl_TEXTURES;

const TEXTURES = ["./img/uvCoords.png", "./img/beacon.png", "./img/ground.png", "./img/star.png", "./img/crystal.png"]

let cubes = null;
let world_width = 100;
let world_depth = 100;
const BLOCK = 0;
const CRYSTAL = 1;
let map = [];
let sphere = null;

let blocky_color = true;
let loading = null;

// Game related stats
let n_sableye = 5;

// Light Info
let light = null;
let lightTransforms = null;
let lightPos = null;
const LEFT = -1;
const RIGHT = 1;
let lightMoveDir = LEFT;
let lightSpeed = 100 / 60 / 10;
let lightDisabled = false;
let normsShowing = false;
let diffuseColor = new Float32Array([0.7, 0.7, 0.7]);
let ambientColor = new Float32Array([0.3, 0.3, 0.3]);
let specColor = new Float32Array([1, 1, 1]);
let lightColor = new Float32Array([1, 1, 1]);




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
  gl_TEXTURES = [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3, gl.TEXTURE4]

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  console.log(gl.getParameter(gl.VERSION));
}

function setUpHTMLActions() {

  // Disable Lighting
  document.getElementById("disable").addEventListener("click", function () {
    if (lightDisabled) {
      this.innerHTML = "Disable Lighting";
    } else {
      this.innerHTML = "Enable Lighting";
    }
    // Toggle light
    lightDisabled = !lightDisabled;
    gl.uniform1i(u_Disable, lightDisabled);
  });

  // Show/Disable Normals
  document.getElementById("normals").addEventListener("click", function () {
    if (normsShowing) {
      this.innerHTML = "Visualize Normals";
    } else {
      this.innerHTML = "Revert to Actual Colors";
    }
    // Toggle light
    normsShowing = !normsShowing;
    console.log(normsShowing);
    gl.uniform1i(u_ShowNorms, normsShowing);
  });

  // Light Position
  document.getElementById("lightX").addEventListener("input", function () {
    lightPos.elements[0] = this.value;
  });

  document.getElementById("lightY").addEventListener("input", function () {
    lightPos.elements[1] = this.value;
  });

  document.getElementById("lightZ").addEventListener("input", function () {
    lightPos.elements[2] = this.value;
  });

  // Colors

  // Diffuse 
  const updateDiffuse = () => {
    document.getElementById("dColor").style.backgroundColor = `rgb(${diffuseColor[0] * 255} ${diffuseColor[1] * 255} ${diffuseColor[2] * 255})`;
  }

  updateDiffuse();

  document.getElementById("dRed").addEventListener("input", function () {
    diffuseColor[0] = this.value / 255;
    gl.uniform3fv(u_DiffuseColor, diffuseColor);
    updateDiffuse();
  });

  document.getElementById("dGreen").addEventListener("input", function () {
    diffuseColor[1] = this.value / 255;
    gl.uniform3fv(u_DiffuseColor, diffuseColor);
    updateDiffuse();
  });

  document.getElementById("dBlue").addEventListener("input", function () {
    diffuseColor[2] = this.value / 255;
    gl.uniform3fv(u_DiffuseColor, diffuseColor);
    updateDiffuse();
  });

  // Ambient
  const updateAmbient = () => {
    document.getElementById("aColor").style.backgroundColor = `rgb(${ambientColor[0] * 255} ${ambientColor[1] * 255} ${ambientColor[2] * 255})`;
  }

  updateAmbient();

  document.getElementById("aRed").addEventListener("input", function () {
    ambientColor[0] = this.value / 255;
    gl.uniform3fv(u_AmbColor, ambientColor);
    updateAmbient();
  });

  document.getElementById("aGreen").addEventListener("input", function () {
    ambientColor[1] = this.value / 255;
    gl.uniform3fv(u_AmbColor, ambientColor);
    updateAmbient();
  });

  document.getElementById("aBlue").addEventListener("input", function () {
    ambientColor[2] = this.value / 255;
    gl.uniform3fv(u_AmbColor, ambientColor);
    updateAmbient();
  });

  // Specular
  const updateSpecular = () => {
    document.getElementById("sColor").style.backgroundColor = `rgb(${specColor[0] * 255} ${specColor[1] * 255} ${specColor[2] * 255})`;
  }

  updateSpecular();

  document.getElementById("sRed").addEventListener("input", function () {
    specColor[0] = this.value / 255;
    gl.uniform3fv(u_SpecColor, specColor);
    updateSpecular();
  });

  document.getElementById("sGreen").addEventListener("input", function () {
    specColor[1] = this.value / 255;
    gl.uniform3fv(u_SpecColor, specColor);
    updateSpecular();
  });

  document.getElementById("sBlue").addEventListener("input", function () {
    specColor[2] = this.value / 255;
    gl.uniform3fv(u_SpecColor, specColor);
    updateSpecular();
  });

  // General Lighting
  const updateLight = () => {
    document.getElementById("color").style.backgroundColor = `rgb(${lightColor[0] * 255} ${lightColor[1] * 255} ${lightColor[2] * 255})`;
  }

  updateLight();

  document.getElementById("red").addEventListener("input", function () {
    lightColor[0] = this.value / 255;
    gl.uniform3fv(u_LightColor, lightColor);
    updateLight();
  });

  document.getElementById("green").addEventListener("input", function () {
    lightColor[1] = this.value / 255;
    gl.uniform3fv(u_LightColor, lightColor);
    updateLight();
  });

  document.getElementById("blue").addEventListener("input", function () {
    lightColor[2] = this.value / 255;
    gl.uniform3fv(u_LightColor, lightColor);
    updateLight();
  });
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

  a_Color = gl.getAttribLocation(gl.program, "a_Color");
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
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

  u_LightPos = gl.getUniformLocation(gl.program, "u_LightPos");
  if (!u_LightPos) {
    console.log('Failed to get the storage location of u_LightPos');
    return;
  }

  u_CameraPos = gl.getUniformLocation(gl.program, "u_CameraPos");
  if (!u_CameraPos) {
    console.error('Failed to get the storage location of u_CameraPos');
    return -1;
  }

  u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
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

  a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  if (!a_Normal) {
    console.error('Failed to get the storage location of a_Normal');
    return -1;
  }

  u_Disable = gl.getUniformLocation(gl.program, "u_Disable");
  if (!u_Disable) {
    console.error('Failed to get the storage location of u_Disable');
    return -1;
  }

  u_DiffuseColor = gl.getUniformLocation(gl.program, "u_DiffuseColor");
  if (!u_DiffuseColor) {
    console.error("Failed to get storage location of u_DiffuseColor");
  }
  // Set starting value
  gl.uniform3fv(u_DiffuseColor, diffuseColor);

  u_AmbColor = gl.getUniformLocation(gl.program, "u_AmbColor");
  if (!u_AmbColor) {
    console.error("Failed to get storage location of u_AmbColor");
  }
  // Set starting value
  gl.uniform3fv(u_AmbColor, ambientColor);

  u_SpecColor = gl.getUniformLocation(gl.program, "u_SpecColor");
  if (!u_SpecColor) {
    console.error("Failed to get storage location of u_SpecColor");
  }
  // Set starting value
  gl.uniform3fv(u_SpecColor, specColor);

  u_ShowNorms = gl.getUniformLocation(gl.program, "u_ShowNorms");
  if (!u_ShowNorms) {
    console.error('Failed to get the storage location of u_ShowNorms');
    return -1;
  }

  u_LightColor = gl.getUniformLocation(gl.program, "u_LightColor");
  if (!u_LightColor) {
    console.error("Failed to get storage location of u_LightColor");
  }
  // Set starting value
  gl.uniform3fv(u_LightColor, lightColor);

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

let speed = 0.1;
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
  } else if (event.keyCode === 8) { // backspace pressed
    getNearestMapPos();
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

let terrain = null;

// Gets map position I am looking at
function getNearestMapPos() {
  let lookingAt = camera.getForward().mul(2).add(camera.eye);
  let x = Math.round(lookingAt.elements[0] + world_width / 2 - 0.5);
  let z = Math.round(lookingAt.elements[2] + world_depth / 2 - 0.5);
  console.log(`${z} ${x}`)
  return [z, x];
}

function removeBlock() {
  let [z, x] = getNearestMapPos();
  if (z < 0 || x < 0 || z >= world_depth || x >= world_width) return;
  if (map[z][x] === 0) return;
  if (map[z][x][0] === BLOCK) {
    map[z][x][1] = map[z][x][1] - 1;
    if (map[z][x][1] === 0) {
      map[z][x] = 0;
    }
  } else if (map[z][x][0] === CRYSTAL) {
    // Freed a sableye
    n_sableye -= 1;
    map[z][x] = 0;
    // Update HTML
    if (n_sableye !== 0) {
      document.getElementById("n_sableye").innerHTML = `Number of Sableye Left: ${n_sableye}`;
    } else {
      document.getElementById("n_sableye").innerHTML = `Congrats! You've freed them all!`;
    }
  }
  buildCubes();
}

function addBlock() {
  let [z, x] = getNearestMapPos();
  if (z < 0 || x < 0 || z >= world_depth || x >= world_width) return;
  if (map[z][x] === 0) {
    map[z][x] = [BLOCK, 1];
  } else if (map[z][x][0] === BLOCK) {
    map[z][x][1] = map[z][x][1] + 1;
  }
  buildCubes();
}


function lightTick() {

  if (lightMoveDir === LEFT) {
    // move left
    lightPos.elements[0] -= lightSpeed;

    // switch
    if (lightPos.elements[0] < -50) {
      lightMoveDir = RIGHT;
    }
  } else {
    // move right
    lightPos.elements[0] += lightSpeed;

    // switch
    if (lightPos.elements[0] > 50) {
      lightMoveDir = LEFT;
    }
  }

  // update transform
  lightTransforms = new Matrix4();
  lightTransforms.translate(lightPos.elements[0], lightPos.elements[1], lightPos.elements[2]);
  lightTransforms.scale(5, 5, 5);
  light.setMatrix(lightTransforms);

  // set the light position
  gl.uniform3fv(u_LightPos, lightPos.elements.slice(0, 3));

  // Update Slider
  document.getElementById("lightX").value = lightPos.elements[0];
}


function main() {
  // Set up website and main canvas
  setUpHTMLActions();
  setUpWebGL();
  connectVariablesToGLSL();
  initTextures();
  g_rotateMatrix = new Matrix4();
  g_translateMatrix = new Matrix4();

  let sphereMat = new Matrix4();
  sphereMat.translate(0, 5, 0);
  sphere = new Sphere([0.7, 0.7, 0.7, 1], sphereMat, -1);


  // Initialize terrain
  // terrain = new Terrain("heightMap", [153 / 255, 0 / 255, 51 / 255, 1], -3, 7, [-50, 50, -50, 50], blocky_color);

  // Initialize cube map
  for (let i = 0; i < world_width; i++) {
    let row = [];
    for (let j = 0; j < world_depth; j++) {
      row.push(0);
    }
    map.push(row);
  }

  // Enable light
  gl.uniform1i(u_Disable, lightDisabled);

  // Draw Light
  lightTransforms = new Matrix4();
  lightTransforms.translate(0, 50, 0);
  lightTransforms.scale(5, 5, 5);
  light = new Cube([1, 1, 0, 1], lightTransforms);

  lightPos = lightTransforms.multiplyVector3(new Vector4([0, 0, 0, 1]));
  // set the light position
  gl.uniform3fv(u_LightPos, lightPos.elements.slice(0, 3));

  light.tick = lightTick;

  map[66][54] = [CRYSTAL, 1];
  map[87][49] = [CRYSTAL, 1];
  map[44][38] = [CRYSTAL, 1];
  map[87][15] = [CRYSTAL, 1];
  map[63][70] = [CRYSTAL, 1];

  document.onkeydown = keydown;
  document.onkeyup = keyup;

  canvas.addEventListener("click", async (event) => {
    if (!locked) {
      await canvas.requestPointerLock({
        unadjustedMovement: true,
      });
    } else if (event.button === 0) { // left click
      console.log(event);
      removeBlock();
    } else if (event.button === 2) { // right click
      addBlock();
    }
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

let my_fps = null;
let last_time = null;
function tick(timestamp) {

  // calc fps
  if (last_time === null) {
    last_time = timestamp;
  } else {
    let frame_time = +timestamp - +last_time;
    my_fps = 1 / (frame_time / 1000);
    last_time = timestamp;
  }

  camera.rotate[1] = rotateY;
  camera.rotate[0] = rotateX;
  camera.update(my_fps);
  rotateY = 0;
  rotateX = 0;
  renderScene();

  // Do animations
  let len = g_shapesList.length;
  for (let i = 0; i < len; i++) {
    let shape = g_shapesList[i];
    shape.render();
    // if that shape has a tick, tick
    if (shape.tick !== undefined) {
      shape.tick(my_fps);
    }
  }

  requestAnimationFrame(tick);
}

function buildCubes() {
  cubes = [];
  for (let i = 0; i < world_width; i++) {
    for (let j = 0; j < world_depth; j++) {
      if (map[i][j] === 0) continue;
      let z = i - world_depth / 2 + 0.5;
      let x = j - world_width / 2 + 0.5;
      for (let k = 0; k < map[i][j][1]; k++) {
        if (map[i][j][0] === BLOCK) {
          let y = k;
          let M = new Matrix4();
          M.translate(x, y, z);
          let cube = new Cube([1, 0, 0, 1], M, 1);
          cubes.push(cube);
        } else if (map[i][j][0] === CRYSTAL) {
          let y = k;
          // Make Sableye trapped in crystal
          let M = new Matrix4();
          M.translate(x, y + 0.5, z);
          M.scale(0.75, 0.75, 0.75);
          let s = new Sableye(M);
          cubes.push(s);

          // Make crystal
          M = new Matrix4();
          M.translate(x, y + 0.5, z);
          M.scale(1.5, 2, 1.5);
          let cube = new Cube([1, 0, 0, 1], M, 4);
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
  // g_shapesList.push(terrain);
  g_shapesList.push(light);
  g_shapesList.push(sphere);

  // Ground
  M = new Matrix4();
  M.translate(0, -0.55, 0);
  M.scale(100, 0.1, 100);
  g_shapesList.push(new Cube([1, 0, 0, 1], M, 2));

  // Skybox 
  M = new Matrix4();
  M.translate(0, 0, 0);
  M.scale(200, 200, 200);
  g_shapesList.push(new Cube([1, 0, 0, 1], M, 3));


  g_rotateMatrix.setRotate(g_yAngle, 0, 1, 0);
  g_rotateMatrix.rotate(g_xAngle, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, g_rotateMatrix.elements);
  let projMat = new Matrix4();

  // First Arg: FOV
  // Second Arg: Aspect Ratio
  // Third Arg: Near Plane Clipping
  // Fourth Arg: Far Plane Clipping
  projMat.setPerspective(60, canvas.width / canvas.height, 0.1, 250);
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
    // if that shape has a tick, tick
    if (shape.tick !== undefined) {
      shape.tick();
    }
  }
}