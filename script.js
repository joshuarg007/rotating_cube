"use strict";

// Initialize WebGL and shader variables
let gl;
let shaderProgram;
let rotation = 0.0;
const mat4 = glMatrix.mat4;
const depth = 3; // Initial subdivision depth
const positions = []; // Array to store vertex positions
const colors = []; // Array to store vertex colors
let index = 0; // Index variable for buffer operations

// Method to initialize WebGL context and start rendering loop
function init() {
    // Retrieve canvas element
    const canvas = document.getElementById('webgl-canvas');
    gl = canvas.getContext('webgl');

    // Check if WebGL is supported
    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    // Set canvas size to match the screen size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Compile shaders and create shader program
    const fragmentShaderSource = document.getElementById('fragment-shader').textContent;
    const vertexShaderSource = document.getElementById('vertex-shader').textContent;
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);

    // Check shader compilation
    if (!fragmentShader || !vertexShader) {
        console.error('Failed to compile shaders.');
        return;
    }

    // Create shader program
    shaderProgram = createProgram(gl, vertexShader, fragmentShader);

    // Check program creation
    if (!shaderProgram) {
        console.error('Failed to create shader program.');
        return;
    }

    // Generate sphere vertices and colors
    const va = vec3(0.0, 0.0, -1.0);
    const vb = vec3(0.0, 0.942809, 0.333333);
    const vc = vec3(-0.816497, -0.471405, 0.333333);
    const vd = vec3(0.816497, -0.471405, 0.333333);

    tetrahedron(va, vb, vc, vd, depth);

    // Set up buffers for vertices and colors
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Retrieve attribute and uniform locations
    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, 'aPosition');
    const colorAttributeLocation = gl.getAttribLocation(shaderProgram, 'aColor');
    const modelViewMatrixUniformLocation = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
    const projectionMatrixUniformLocation = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');

    // Start rendering loop
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const modelViewMatrix = mat4.create();
        const projectionMatrix = mat4.create();

        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]);
        mat4.rotateY(modelViewMatrix, modelViewMatrix, rotation);
        mat4.perspective(projectionMatrix, Math.PI / 3, canvas.width / canvas.height, 0.1, 100.0);

        // Use the shader program
        gl.useProgram(shaderProgram);

        // Set uniform values
        gl.uniformMatrix4fv(modelViewMatrixUniformLocation, false, modelViewMatrix);
        gl.uniformMatrix4fv(projectionMatrixUniformLocation, false, projectionMatrix);

        // Set attribute pointers
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorAttributeLocation);

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);

        rotation += 0.01;

        requestAnimationFrame(render);
    }

    // Set WebGL parameters
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Start rendering loop
    render();
}

// Method to generate vertices of a tetrahedron and recursively subdivide to approximate a sphere
function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, d, n);
    divideTriangle(d, c, b, a, n);
    divideTriangle(a, d, b, c, n);
    divideTriangle(a, c, d, b, n);
}

// Method to recursively divide a triangle into smaller triangles
function divideTriangle(a, b, c, d, count) {
    if (count > 0) {
        const ab = normalize(mix(a, b, 0.5));
        const ac = normalize(mix(a, c, 0.5));
        const ad = normalize(mix(a, d, 0.5));
        const bc = normalize(mix(b, c, 0.5));
        const bd = normalize(mix(b, d, 0.5));
        const cd = normalize(mix(c, d, 0.5));

        count--;

        divideTriangle(a, ab, ac, ad, count);
        divideTriangle(ab, b, bc, bd, count);
        divideTriangle(ac, bc, c, cd, count);
        divideTriangle(ad, bd, cd, d, count);
        divideTriangle(ab, bc, ac, ad, count);
    } else {
        triangle(a, b, c);
        triangle(a, c, d);
    }
}

// Method to add a triangle to the vertex positions and colors arrays
function triangle(a, b, c) {
    positions.push(a[0], a[1], a[2]);
    positions.push(b[0], b[1], b[2]);
    positions.push(c[0], c[1], c[2]);

    // Assign random colors for each vertex
    colors.push(Math.random(), Math.random(), Math.random());
    colors.push(Math.random(), Math.random(), Math.random());
    colors.push(Math.random(), Math.random(), Math.random());
}

// Method to compile a shader
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// Method to create a shader program
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

// Method to interpolate between two vectors
function mix(a, b, t) {
    return [
        (1 - t) * a[0] + t * b[0],
        (1 - t) * a[1] + t * b[1],
        (1 - t) * a[2] + t * b[2]
    ];
}

// Method to create a 3D vector
function vec3(x, y, z) {
    return [x, y, z];
}

// Method to normalize a vector
function normalize(v) {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / length, v[1] / length, v[2] / length];
}

// Event listener to initialize WebGL after DOM content is loaded
document.addEventListener('DOMContentLoaded', init);
