let gl;
let shaderProgram;
let rotation = 0.0;
let cubeDistance = 6.0; // Initial distance of the cube
const mat4 = glMatrix.mat4;
let depthSlider; // Declare depthSlider variable to hold the slider element

function init() {
    const canvas = document.getElementById('webgl-canvas');
    gl = canvas.getContext('webgl');

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

    if (!fragmentShader || !vertexShader) {
        console.error('Failed to compile shaders.');
        return;
    }

    // Retrieve the depth slider element
    depthSlider = document.getElementById('depthSlider');

    shaderProgram = createProgram(gl, vertexShader, fragmentShader);

    if (!shaderProgram) {
        console.error('Failed to create shader program.');
        return;
    }

    // Retrieve attribute and uniform locations
    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, 'aPosition');
    const colorAttributeLocation = gl.getAttribLocation(shaderProgram, 'aColor');
    const modelViewMatrixUniformLocation = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
    const projectionMatrixUniformLocation = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');

    // Check if attribute and uniform locations were retrieved successfully
    if (positionAttributeLocation === -1 || colorAttributeLocation === -1 ||
        modelViewMatrixUniformLocation === null || projectionMatrixUniformLocation === null) {
        console.error('Failed to get attribute or uniform locations.');
        return;
    }

    // Define cube vertices, colors, and indices
    const vertices = [
        // Front face
        -0.5, -0.5,  0.5,
         0.5, -0.5,  0.5,
         0.5,  0.5,  0.5,
        -0.5,  0.5,  0.5,
    
        // Back face
        -0.5, -0.5, -0.5,
        -0.5,  0.5, -0.5,
         0.5,  0.5, -0.5,
         0.5, -0.5, -0.5,
    
        // Top face
        -0.5,  0.5, -0.5,
        -0.5,  0.5,  0.5,
         0.5,  0.5,  0.5,
         0.5,  0.5, -0.5,
    
        // Bottom face
        -0.5, -0.5, -0.5,
         0.5, -0.5, -0.5,
         0.5, -0.5,  0.5,
        -0.5, -0.5,  0.5,
    
        // Right face
         0.5, -0.5, -0.5,
         0.5,  0.5, -0.5,
         0.5,  0.5,  0.5,
         0.5, -0.5,  0.5,
    
        // Left face
        -0.5, -0.5, -0.5,
        -0.5, -0.5,  0.5,
        -0.5,  0.5,  0.5,
        -0.5,  0.5, -0.5,
    ];

    // Adjust the size of the cube
    const scale = 2.0;
    for (let i = 0; i < vertices.length; i++) {
        vertices[i] *= scale;
    }

    const colors = [
        [1.0, 1.0, 1.0, 1.0],    // Front face: white
        [1.0, 0.0, 0.0, 1.0],    // Back face: red
        [0.0, 1.0, 0.0, 1.0],    // Top face: green
        [0.0, 0.0, 1.0, 1.0],    // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0],    // Right face: yellow
        [1.0, 0.0, 1.0, 1.0],    // Left face: purple
    ];

    const indices = [
        0,  1,  2,      0,  2,  3,    // Front face
        4,  5,  6,      4,  6,  7,    // Back face
        8,  9,  10,     8,  10, 11,   // Top face
        12, 13, 14,     12, 14, 15,   // Bottom face
        16, 17, 18,     16, 18, 19,   // Right face
        20, 21, 22,     20, 22, 23,   // Left face
    ];

    // Create buffer objects
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors.flat()), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Start rendering loop
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        const modelViewMatrix = mat4.create();
        const projectionMatrix = mat4.create();
    
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -cubeDistance]);
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
        gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorAttributeLocation);
    
        // Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    
        rotation += 0.01;
    
        requestAnimationFrame(render);
    }

    // Set WebGL parameters
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Add event listener to update cube distance when slider value changes
    depthSlider.addEventListener('input', function() {
        cubeDistance = parseFloat(depthSlider.value);
    });

    // Start rendering loop
    render();
}

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

document.addEventListener('DOMContentLoaded', init);
