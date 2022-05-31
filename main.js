"use strict";


var outerVertexRadius = 150;
var innerVertexRadius = 90;
var selProjType = 1;

var canvas = document.querySelector("#canvas");

var isOrtho = true;
var isObl = false;
var isPers = false;

var model = {}

/*Cube*/
var vertex = [];

/*Column is longer*/
var faces = [];

var positions_global = [];

var shading_global = false;



function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }
  // setup GLSL program
    //Find shader code
    var vertexShaderSource = document.querySelector("#vertexShader3d").text;
    var fragmentShaderSource = document.querySelector("#fragmentShader3d").text;

    //Make shader
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    //Make program
    var program = createProgram(gl, vertexShader, fragmentShader);


  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var colorLocation = gl.getAttribLocation(program, "a_color");
  var normalLocation = gl.getAttribLocation(program, "a_vertexNormal");

  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
  var normalMatrixLocation = gl.getUniformLocation(program, "u_normalMatrix");
  var shadingBool = gl.getUniformLocation(program, "u_shading");

  // Create a buffer to put positions in
  var positionBuffer = gl.createBuffer();
  var colorBuffer = gl.createBuffer();
  var normalBuffer = gl.createBuffer();

  var positions_length = 0;

  function setBuffer() {
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Put geometry data into buffer
    positions_length = setGeometry(gl);


    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    const vertexNormals = getVectorNormals(positions_global);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(vertexNormals),
      gl.STATIC_DRAW);
    // Create a buffer to put colors in
    
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    // Put color data into buffer
    setColors(gl);
  }

  setBuffer()
  
  

  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var cameraAngleRadians = degToRad(0);
  var cameraPitchRadians = degToRad(0);
  var radius = 200;
  var fieldOfViewRadians = degToRad(60);

  var translation = [0,0,0];
  var rotation = [degToRad(0), degToRad(0), degToRad(0)];
  var scale = [1, 1, 1];

  

  // Setup a ui.
  ui.setupSlider("#cameraAngle", {value: radToDeg(cameraAngleRadians), slide: updateCameraAngle, min: -360, max: 360});
  function updateCameraAngle(event, ui) {
    cameraAngleRadians = degToRad(ui.value);
    drawScene();
  }

  ui.setupSlider("#cameraPitch", {value: radToDeg(cameraPitchRadians), slide: updateCameraPitch, min: -89, max: 89});
  function updateCameraPitch(event, ui) {
    cameraPitchRadians = degToRad(ui.value);
    drawScene();
  }

  
  ui.setupSlider("#cameraZoom", {value: radius, slide: updateCameraZoom, min: 1, max: 800});
  function updateCameraZoom(event, ui) {
    radius = ui.value;
    drawScene();
  }

  ui.setupSlider("#x", {value: translation[0], slide: updatePosition(0), max: gl.canvas.width, min: -gl.canvas.width })
  ui.setupSlider("#y", {value: translation[1], slide: updatePosition(1), max: gl.canvas.height, min: -gl.canvas.height});
  ui.setupSlider("#z", {value: translation[2], slide: updatePosition(2), max: gl.canvas.height, min: -gl.canvas.height});
  ui.setupSlider("#angleX", {value: radToDeg(rotation[0]), slide: updateRotation(0), max: 360});
  ui.setupSlider("#angleY", {value: radToDeg(rotation[1]), slide: updateRotation(1), max: 360});
  ui.setupSlider("#angleZ", {value: radToDeg(rotation[2]), slide: updateRotation(2), max: 360});
  ui.setupSlider("#scaleX", {value: scale[0], slide: updateScale(0), min: -5, max: 5, step: 0.01, precision: 2});
  ui.setupSlider("#scaleY", {value: scale[1], slide: updateScale(1), min: -5, max: 5, step: 0.01, precision: 2});
  ui.setupSlider("#scaleZ", {value: scale[2], slide: updateScale(2), min: -5, max: 5, step: 0.01, precision: 2});

  function updatePosition(index) {
    return function(event, ui) {
      translation[index] = ui.value;
      // transX = translation[0];
      // transY = translation[1];
      // transZ = translation[2];
      drawScene();
    };
  }


  function updateRotation(index) {
    return function(event, ui) {
      var angleInDegrees = ui.value;
      var angleInRadians = angleInDegrees * Math.PI / 180;
      rotation[index] = angleInRadians;
      // rotX = rotation[0];
      // rotY = rotation[1];
      // rotZ = rotation[2];
      drawScene();
    };
  }

  function updateScale(index) {
    return function(event, ui) {
      scale[index] = ui.value;
      drawScene();
    };
  }

  function resetUI() {
    cameraAngleRadians = degToRad(0);
    cameraPitchRadians = degToRad(0);
    radius = 200;
    ui.setupSlider("#cameraAngle", {value: radToDeg(cameraAngleRadians), slide: updateCameraAngle, min: -360, max: 360});
    ui.setupSlider("#cameraPitch", {value: radToDeg(cameraPitchRadians), slide: updateCameraPitch, min: -89, max: 89});
    ui.setupSlider("#cameraZoom", {value: radius, slide: updateCameraZoom, min: 1, max: 800});
    ui.setupSlider("#x", {value: translation[0], slide: updatePosition(0), max: gl.canvas.width, min: -gl.canvas.width})
    ui.setupSlider("#y", {value: translation[1], slide: updatePosition(1), max: gl.canvas.height, min: -gl.canvas.height});
    ui.setupSlider("#z", {value: translation[2], slide: updatePosition(2), max: gl.canvas.height, min: -gl.canvas.height});
    ui.setupSlider("#angleX", {value: radToDeg(rotation[0]), slide: updateRotation(0), max: 360});
    ui.setupSlider("#angleY", {value: radToDeg(rotation[1]), slide: updateRotation(1), max: 360});
    ui.setupSlider("#angleZ", {value: radToDeg(rotation[2]), slide: updateRotation(2), max: 360});
    ui.setupSlider("#scaleX", {value: scale[0], slide: updateScale(0), min: -5, max: 5, step: 0.01, precision: 2});
    ui.setupSlider("#scaleY", {value: scale[1], slide: updateScale(1), min: -5, max: 5, step: 0.01, precision: 2});
    ui.setupSlider("#scaleZ", {value: scale[2], slide: updateScale(2), min: -5, max: 5, step: 0.01, precision: 2});
  
  }

  drawScene();

  // Draw the scene.
  function drawScene() {
    
    resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // Turn on the color attribute
    gl.enableVertexAttribArray(colorLocation);

    // Bind the color buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
    var size = 3;                 // 3 components per iteration
    var type = gl.UNSIGNED_BYTE;  // the data is 8bit unsigned values
    var normalize = true;         // normalize the data (convert from 0-255 to 0-1)
    var stride = 0;               // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;               // start at the beginning of the buffer
    gl.vertexAttribPointer(
        colorLocation, size, type, normalize, stride, offset);


    gl.enableVertexAttribArray(normalLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    var size = 3;                 // 3 components per iteration
    var type = gl.FLOAT;  // the data is 8bit unsigned values
    var normalize = true;         // normalize the data (convert from 0-255 to 0-1)
    var stride = 0;               // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;               // start at the beginning of the buffer
    gl.vertexAttribPointer(
        normalLocation, size, type, normalize, stride, offset);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    var objectPosition = [0, 0, 0];

    // Use matrix math to compute a position on a circle where
    // the camera is
    var cameraMatrix = m4.yRotation(cameraAngleRadians);
    cameraMatrix = m4.xRotate(cameraMatrix, cameraPitchRadians);
    cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);

    // Get the camera's position from the matrix we computed
    var cameraPosition = [
      cameraMatrix[12],
      cameraMatrix[13],
      cameraMatrix[14],
    ];

    var up = [0, 1, 0];

    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, objectPosition, up);

    // Make a view matrix from the camera matrix
    var viewMatrix = m4.inverse(cameraMatrix);

    if (isOrtho && !isObl && !isPers) {
      viewMatrix = m4.inverse(cameraMatrix);
    }
    else if (!isOrtho && isObl && !isPers) {
      viewMatrix = projObl(viewMatrix);
    }
    else if (!isOrtho && !isObl && isPers) {
      viewMatrix = projPers(viewMatrix);
    }

    // Compute a view projection matrix
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    let matrix = m4.translate(viewProjectionMatrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

    var normalMatrix = m4.inverse(matrix);
    normalMatrix = m4.transpose(normalMatrix);

    gl.uniformMatrix4fv(matrixLocation, false, matrix);
    gl.uniformMatrix4fv(normalMatrixLocation, false, normalMatrix);
    gl.uniform1i(shadingBool, shading_global);

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = positions_length/3;
    gl.drawArrays(primitiveType, offset, count);
  }




  return {
    drawScene: drawScene,
    gl: gl,
    setBuffer: setBuffer,
    resetUI: resetUI,
  }


}

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  
  gl.deleteProgram(program);
}

function resizeCanvasToDisplaySize(canvas, multiplier) {
  multiplier = multiplier || 1;
  const width  = canvas.clientWidth  * multiplier | 0;
  const height = canvas.clientHeight * multiplier | 0;
  if (canvas.width !== width ||  canvas.height !== height) {
    canvas.width  = width;
    canvas.height = height;
    return true;
  }
  return false;
}

function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalize(v) {
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // make sure we don't divide by 0.
  if (length > 0.00001) {
    return [v[0] / length, v[1] / length, v[2] / length];
  } else {
    return [0, 0, 0];
  }
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]];
}




function setGeometry(gl) {
  var positions = []

  for (var i = 0; i < faces.length; i++) {
      positions.push(vertex[faces[i]][0])
      positions.push(vertex[faces[i]][1])
      positions.push(vertex[faces[i]][2])
      
  }

  

  var positions = new Float32Array(positions)
  
  /*Dipakai untuk debugging*/
  var matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
  matrix = m4.xRotation(0);
  matrix = m4.translate(matrix, 0, 0 , 0);

  for (var ii = 0; ii < positions.length; ii += 3) {
    var vector = m4.vectorMultiply([positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix);
    positions[ii + 0] = vector[0];
    positions[ii + 1] = vector[1];
    positions[ii + 2] = vector[2];
  }
  positions_global = positions;

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  return positions.length;
}

function setColors(gl) {
  
  var list = []
  for (var i = 0; i < faces.length/3/4; i++) {
    for (var j = 0; j < 3; j++) {
      list.push(200)
      list.push(70)
      list.push(120)
    }

    for (var j = 0; j < 3; j++) {
      list.push(80)
      list.push(70)
      list.push(200)
    }

    for (var j = 0; j < 3; j++) {
      list.push(70)
      list.push(200)
      list.push(210)
    }

    for (var j = 0; j < 3; j++) {
      list.push(200)
      list.push(200)
      list.push(70)
    }
    
  }
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array(list),
      gl.STATIC_DRAW);
}

function createCubeObject(){
  model = {
    vertex: [
    /*Inner*/
    /*0*/[ -innerVertexRadius, -innerVertexRadius,  innerVertexRadius],
    [  innerVertexRadius, -innerVertexRadius,  innerVertexRadius],
    [  innerVertexRadius, -innerVertexRadius, -innerVertexRadius],
    [ -innerVertexRadius, -innerVertexRadius, -innerVertexRadius],
    [ -innerVertexRadius,  innerVertexRadius,  innerVertexRadius],
    [  innerVertexRadius,  innerVertexRadius,  innerVertexRadius],
    [  innerVertexRadius,  innerVertexRadius, -innerVertexRadius],
    [ -innerVertexRadius,  innerVertexRadius, -innerVertexRadius], 
    /*Outer*/
    /*8*/[ -outerVertexRadius, -outerVertexRadius,  outerVertexRadius],
    [  outerVertexRadius, -outerVertexRadius,  outerVertexRadius],
    [  outerVertexRadius, -outerVertexRadius, -outerVertexRadius],
    [ -outerVertexRadius, -outerVertexRadius, -outerVertexRadius],
    [ -outerVertexRadius,  outerVertexRadius,  outerVertexRadius],
    [  outerVertexRadius,  outerVertexRadius,  outerVertexRadius],
    [  outerVertexRadius,  outerVertexRadius, -outerVertexRadius],
    [ -outerVertexRadius,  outerVertexRadius, -outerVertexRadius], 
    /*Front*/
    /*16*/[ -innerVertexRadius, -innerVertexRadius,  outerVertexRadius],
    [  innerVertexRadius, -innerVertexRadius,  outerVertexRadius],
    [  innerVertexRadius,  innerVertexRadius,  outerVertexRadius],
    [ -innerVertexRadius,  innerVertexRadius,  outerVertexRadius],
    /*Back*/
    /*20*/[ -innerVertexRadius, -innerVertexRadius, -outerVertexRadius],
    [  innerVertexRadius, -innerVertexRadius, -outerVertexRadius],
    [  innerVertexRadius,  innerVertexRadius, -outerVertexRadius],
    [ -innerVertexRadius,  innerVertexRadius, -outerVertexRadius],
  
    /*Right*/
    /*24*/[  outerVertexRadius, -innerVertexRadius,  innerVertexRadius],
    [  outerVertexRadius, -innerVertexRadius, -innerVertexRadius],
    [  outerVertexRadius,  innerVertexRadius, -innerVertexRadius],
    [  outerVertexRadius,  innerVertexRadius,  innerVertexRadius],
    /*Left*/
    /*28*/[ -outerVertexRadius, -innerVertexRadius,  innerVertexRadius],
    [ -outerVertexRadius, -innerVertexRadius, -innerVertexRadius],
    [ -outerVertexRadius,  innerVertexRadius, -innerVertexRadius],
    [ -outerVertexRadius,  innerVertexRadius,  innerVertexRadius],
    /*top*/
    /*32*/[ -innerVertexRadius,  outerVertexRadius,  innerVertexRadius],
    [  innerVertexRadius,  outerVertexRadius,  innerVertexRadius],
    [  innerVertexRadius,  outerVertexRadius, -innerVertexRadius],
    [ -innerVertexRadius,  outerVertexRadius, -innerVertexRadius],
    /*Bottom*/
    /*36*/[ -innerVertexRadius, -outerVertexRadius,  innerVertexRadius],
    [  innerVertexRadius, -outerVertexRadius,  innerVertexRadius],
    [  innerVertexRadius, -outerVertexRadius, -innerVertexRadius],
    [ -innerVertexRadius, -outerVertexRadius, -innerVertexRadius],
    
    ],
    faces: [
    /*Bottom Front*/
    8, 9, 16,
    9, 17, 16,
    0, 16, 17,
    0, 17, 1,
    0, 1, 37,
    0, 37, 36,
    8, 36, 9,
    36, 37, 9,
  
    /*Bottom Left*/
    8, 28, 29,
    8, 29, 11,
    0, 29, 28,
    0, 3,  29,
    0, 36, 39,
    0, 39, 3, 
    8, 11, 36,
    11, 39, 36,
  
    /*Bottom Back*/
    11,20,21,
    10,11,21,
    2,3,39,
    2,39,38,
    3,21,20,
    2,21,3,
    11,10,38,
    11,38,39,
  
    /*Bottom Right*/
    9,10,24,
    24,10,25,
    1,24,2,
    2,24,25,
    1,2,37,
    2,38,37,
    9,37,38,
    9,38,10,
  
    /*Front Left*/
    8, 16, 12,
    16, 19, 12,
    8, 12, 31,
    8, 31, 28,
    4, 28, 31,
    4, 0, 28,
    0, 19, 16,
    0, 4, 19,
  
    /*Front Right*/
    9, 18, 17,
    9, 13, 18,
    9, 24, 27,
    9, 27, 13,
    1, 17, 18,
    1, 18, 5,
    1, 5, 24, 
    5, 27, 24,
  
    /*Back Right*/
    10, 26, 25,
    10, 14, 26,
    2, 25, 26,
    2, 26, 6,
    10, 21, 22,
    10, 22, 14,
    2, 22, 21,
    2, 6, 22,
  
    /*Back Left*/
    11, 29, 30,
    11, 30, 15,
    11, 15, 23, 
    11, 23, 20,
    3, 20, 23,
    3, 23, 7,
    3, 7, 30,
    3, 30, 29,
  
    /*Top Front*/
    19,18,12,
    18,13,12,
    12,13,33,
    12,33,32,
    4,18,19,
    4,5,18,
    4,32,33,
    4,33,5,
  
    /*Top Right*/
    27,14,13,
    27,26,14,
    13,34,33,
    13,14,34,
    5,33,34,
    5,34,6,
    5,6,26,
    5,26,27,
  
    /*Top Back*/
    23,15,14,
    23,14,22,
    35,14,15,
    35,34,14,
    7,34,35,
    7,6,34,
    7,23,22,
    7,22,6,
  
    /*Top left*/
    15,31,12,
    15,30,31,
    30,4,31,
    30,7,4,
    4,35,32,
    4,7,35,
    12,35,15,
    12,32,35,
    ]
  }
  return obj;
}

function createHollowObjectRec(){
  var x = 100;
  var y = 100;
  var w = 40;
  var v = [
    [-x - w*Math.sqrt(2), 0, w/2],
    [-x - w*Math.sqrt(2)/2, w*Math.sqrt(2)/2, w/2],
    [-x - w*Math.sqrt(2)/2, -w*Math.sqrt(2)/2, w/2],
    [-x, 0, w/2],

    [-x - w*Math.sqrt(2)/2, w*Math.sqrt(2)/2, w/2],
    [-w*Math.sqrt(2)/2, y + w*Math.sqrt(2)/2, w/2],
    [-x, 0, w/2],
    [0, y, w/2],

    [0,  y + w*Math.sqrt(2), w/2],
    [w*Math.sqrt(2)/2, y + w*Math.sqrt(2)/2, w/2],
    [-w*Math.sqrt(2)/2, y + w*Math.sqrt(2)/2, w/2],
    [0, y, w/2],

    [w*Math.sqrt(2)/2, y + w*Math.sqrt(2)/2, w/2],
    [x + w*Math.sqrt(2)/2, w*Math.sqrt(2)/2, w/2],
    [0, y, w/2],
    [x, 0, w/2],

    [x + w*Math.sqrt(2), 0, w/2],
    [x + w*Math.sqrt(2)/2, -w*Math.sqrt(2)/2, w/2],
    [x + w*Math.sqrt(2)/2, w*Math.sqrt(2)/2, w/2],
    [x, 0, w/2],

    [x + w*Math.sqrt(2)/2, -w*Math.sqrt(2)/2, w/2],
    [w*Math.sqrt(2)/2, -y - w*Math.sqrt(2)/2, w/2],
    [x, 0, w/2],
    [0, -y, w/2],

    [0,  -y - w*Math.sqrt(2), w/2],
    [-w*Math.sqrt(2)/2, -y - w*Math.sqrt(2)/2, w/2],
    [w*Math.sqrt(2)/2, -y - w*Math.sqrt(2)/2, w/2],
    [0, -y, w/2],

    [-w*Math.sqrt(2)/2, -y - w*Math.sqrt(2)/2, w/2],
    [-x - w*Math.sqrt(2)/2, -w*Math.sqrt(2)/2, w/2],
    [0, -y, w/2],
    [-x, 0, w/2],



    [-x - w*Math.sqrt(2), 0, -w/2],
    [-x - w*Math.sqrt(2)/2, -w*Math.sqrt(2)/2, -w/2],
    [-x - w*Math.sqrt(2)/2, w*Math.sqrt(2)/2, -w/2],
    [-x, 0, -w/2],

    [-x, 0, -w/2],
    [0, y, -w/2],
    [-x - w*Math.sqrt(2)/2, w*Math.sqrt(2)/2, -w/2],
    [-w*Math.sqrt(2)/2, y + w*Math.sqrt(2)/2, -w/2],

    [0,  y + w*Math.sqrt(2), -w/2],
    [-w*Math.sqrt(2)/2, y + w*Math.sqrt(2)/2, -w/2],
    [w*Math.sqrt(2)/2, y + w*Math.sqrt(2)/2, -w/2],
    [0, y, -w/2],

    [0, y, -w/2],
    [x, 0, -w/2],
    [w*Math.sqrt(2)/2, y + w*Math.sqrt(2)/2, -w/2],
    [x + w*Math.sqrt(2)/2, w*Math.sqrt(2)/2, -w/2],

    [x + w*Math.sqrt(2), 0, -w/2],
    [x + w*Math.sqrt(2)/2, w*Math.sqrt(2)/2, -w/2],
    [x + w*Math.sqrt(2)/2, -w*Math.sqrt(2)/2, -w/2],
    [x, 0, -w/2],

    [x, 0, -w/2],
    [0, -y, -w/2],
    [x + w*Math.sqrt(2)/2, -w*Math.sqrt(2)/2, -w/2],
    [w*Math.sqrt(2)/2, -y - w*Math.sqrt(2)/2, -w/2],

    [0,  -y - w*Math.sqrt(2), -w/2],
    [w*Math.sqrt(2)/2, -y - w*Math.sqrt(2)/2, -w/2],
    [-w*Math.sqrt(2)/2, -y - w*Math.sqrt(2)/2, -w/2],
    [0, -y, -w/2],

    [0, -y, -w/2],
    [-x, 0, -w/2],
    [-w*Math.sqrt(2)/2, -y - w*Math.sqrt(2)/2, -w/2],
    [-x - w*Math.sqrt(2)/2, -w*Math.sqrt(2)/2, -w/2],



    [-x - w*Math.sqrt(2), 0, -w/2],
    [0,  y + w*Math.sqrt(2), -w/2],
    [-x - w*Math.sqrt(2), 0, w/2],
    [0,  y + w*Math.sqrt(2), w/2],

    [0,  y + w*Math.sqrt(2), -w/2],
    [x + w*Math.sqrt(2), 0, -w/2],
    [0,  y + w*Math.sqrt(2), w/2],
    [x + w*Math.sqrt(2), 0, w/2],

    [x + w*Math.sqrt(2), 0, -w/2],
    [0,  -y - w*Math.sqrt(2), -w/2],
    [x + w*Math.sqrt(2), 0, w/2],
    [0,  -y - w*Math.sqrt(2), w/2],

    [0,  -y - w*Math.sqrt(2), -w/2],
    [-x - w*Math.sqrt(2), 0, -w/2],
    [0,  -y - w*Math.sqrt(2), w/2],
    [-x - w*Math.sqrt(2), 0, w/2],



    [-x, 0, w/2],
    [0,  y, w/2],
    [-x, 0, -w/2],
    [0,  y, -w/2],

    [0,  y, w/2],
    [x, 0, w/2],
    [0,  y, -w/2],
    [x, 0, -w/2],

    [x, 0, w/2],
    [0,  -y, w/2],
    [x, 0, -w/2],
    [0,  -y, -w/2],

    [0,  -y, w/2],
    [-x, 0, w/2],
    [0,  -y, -w/2],
    [-x, 0, -w/2],
  ]

  var matrix = m4.yRotation(0);
  matrix = m4.scale(matrix, 0.25, 0.25, 0.25);
  matrix = m4.translate(matrix, 0, 0, 8 * w);

  var vnew = [];
  for (var ii = 0; ii < v.length; ii++) {
    var vector = m4.vectorMultiply([].concat(v[ii], 1), matrix);
    var temp = [vector[0], vector[1], vector[2]];
    vnew.push(temp);
  }

  var matrix2 = m4.yRotation(0);
  matrix2 = m4.scale(matrix2, 0.5, 0.5, 0.5);
  matrix2 = m4.translate(matrix2, 0, 0, 2 * w);

  var vnew2 = [];
  for (var ii = 0; ii < v.length; ii++) {
    var vector = m4.vectorMultiply([].concat(v[ii], 1), matrix2);
    var temp = [vector[0], vector[1], vector[2]];
    vnew2.push(temp);
  }

  v = v.concat(vnew);
  v = v.concat(vnew2);

  var matrix3 = m4.yRotation(Math.PI);

  var vnew3 = [];
  for (var ii = 0; ii < v.length; ii++) {
    var vector = m4.vectorMultiply([].concat(v[ii], 1), matrix3);
    var temp = [vector[0], vector[1], vector[2]];
    vnew3.push(temp);
  }

  v = v.concat(vnew3);

  var f = generateIndices(v.length);

  var obj = {
    vertex: v,
    faces: f
  }
  
  return obj;

}

function generateIndices(vertex_length){
  var indices = [];
  for (var i = 0; i < vertex_length; i=i+4){
    indices.push(i);
    indices.push(i+2);
    indices.push(i+3);

    indices.push(i);
    indices.push(i+3);
    indices.push(i+1);
  }
  return indices;
}


var mainReturn = main()
var drawSceneFunction = mainReturn.drawScene

var globalGL = mainReturn.gl

function handleResetView() {
  
  mainReturn.resetUI()
  rerender()
}

function rerender() {
  mainReturn.setBuffer()
  mainReturn.drawScene()
}

function handleProjType(int) {
  if (int == 1) {
    isOrtho = true
    isObl = false
    isPers = false
    rerender()
  }
  else if (int == 2) {
    isOrtho = false
    isObl = true
    isPers = false
    rerender()
  }
  else if (int == 3) {
    isOrtho = false
    isObl = false
    isPers = true
    rerender()
  }
}

function projObl(viewMatrix) {
  let invX = 1 / 2;
  let invY = 1 / 2;
  let invZ = 1 / 2;

  let ST = [
      2 * invX, 0, 0, 0,
      0, 2 * invY, 0, 0,
      0, 0, -2 * invZ, 0,
      0, 0, 0, 1
  ];

  let theta = 75.0;
  let phi = 85.0;
  let cottheta = 1 / Math.tan((theta / 180.0) * Math.PI);
  let cotphi = 1 / Math.tan((phi / 180.0) * Math.PI);

  let H = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      -cottheta, -cotphi, 1, 0,
      0, 0, 0, 1
  ];

  let finalMatrix = m4.multiply(H, ST);
  return m4.multiply(viewMatrix, finalMatrix);
}

function projPers(viewMatrix) {
  let aspect = canvas.clientHeight / canvas.clientWidth;
  var zNear = 0.1;
  var zFar = 2000;
  var fov = 100;

  let f = Math.tan(Math.PI * 0.5 * (1 - fov / 180));
  let rangeInv = 1.0 / (zNear - zFar);
  

  let m = [
      f * aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (zNear + zFar) * rangeInv, -1,  
      0, 0, zNear * zFar * rangeInv * 2, 0,
  ];

 return m4.multiply(viewMatrix, m);
}

function handleClickShading(){
  let checkbox = document.getElementById('shading');
  if(checkbox.checked){
    shading_global = true;
  } else{
    shading_global = false;
  }
  mainReturn.drawScene();
}