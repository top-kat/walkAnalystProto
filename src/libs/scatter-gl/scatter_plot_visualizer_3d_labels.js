"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = require("three");
var util = require("./util");
var constants_1 = require("./constants");
var MAX_CANVAS_DIMENSION = 8192;
var NUM_GLYPHS = 256;
var VERTICES_PER_GLYPH = 2 * 3;
var makeVertexShader = function (fontSize, scale) { return "\n      attribute vec2 posObj;\n      attribute vec4 color;\n      varying vec2 vUv;\n      varying vec4 vColor;\n\n      void main() {\n        vUv = uv;\n        vColor = color;\n\n        // Rotate label to face camera.\n\n        vec4 vRight = vec4(\n          modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0], 0);\n\n        vec4 vUp = vec4(\n          modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1], 0);\n\n        vec4 vAt = -vec4(\n          modelViewMatrix[0][2], modelViewMatrix[1][2], modelViewMatrix[2][2], 0);\n\n        mat4 pointToCamera = mat4(vRight, vUp, vAt, vec4(0, 0, 0, 1));\n\n        vec2 scaledPos = posObj * " + 1 / fontSize + " * " + scale + ";\n\n        vec4 posRotated = pointToCamera * vec4(scaledPos, 0, 1);\n        vec4 mvPosition = modelViewMatrix * (vec4(position, 0) + posRotated);\n        gl_Position = projectionMatrix * mvPosition;\n      }"; };
var FRAGMENT_SHADER = "\n      uniform sampler2D glyphTexture;\n      uniform bool picking;\n      varying vec2 vUv;\n      varying vec4 vColor;\n\n      void main() {\n        if (picking) {\n          gl_FragColor = vColor;\n        } else {\n          vec4 fromTexture = texture(glyphTexture, vUv);\n          gl_FragColor = vColor * fromTexture;\n        }\n      }";
var ScatterPlotVisualizer3DLabels = (function () {
    function ScatterPlotVisualizer3DLabels(styles) {
        this.styles = styles;
        this.id = '3D_LABELS';
        this.labelStrings = [];
        this.worldSpacePointPositions = new Float32Array(0);
        this.pickingColors = new Float32Array(0);
        this.renderColors = new Float32Array(0);
        this.uniforms = {};
        this.totalVertexCount = 0;
        this.labelVertexMap = [];
    }
    ScatterPlotVisualizer3DLabels.prototype.createGlyphTexture = function () {
        var _a = this.styles.label3D, fontSize = _a.fontSize, backgroundColor = _a.backgroundColor, color = _a.color;
        var canvas = document.createElement('canvas');
        canvas.width = MAX_CANVAS_DIMENSION;
        canvas.height = fontSize;
        var ctx = canvas.getContext('2d');
        ctx.font = 'bold ' + fontSize + 'px roboto';
        ctx.textBaseline = 'top';
        ctx.fillStyle = backgroundColor;
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fill();
        ctx.fillStyle = color;
        var spaceOffset = ctx.measureText(' ').width;
        var glyphLengths = new Float32Array(NUM_GLYPHS);
        var glyphOffset = new Float32Array(NUM_GLYPHS);
        var leftCoord = 0;
        for (var i = 0; i < NUM_GLYPHS; i++) {
            var text = ' ' + String.fromCharCode(i);
            var textLength = ctx.measureText(text).width;
            glyphLengths[i] = textLength - spaceOffset;
            glyphOffset[i] = leftCoord;
            ctx.fillText(text, leftCoord - spaceOffset, 0);
            leftCoord += textLength;
        }
        var tex = util.createTextureFromCanvas(canvas);
        return { texture: tex, lengths: glyphLengths, offsets: glyphOffset };
    };
    ScatterPlotVisualizer3DLabels.prototype.processLabelVerts = function (pointCount) {
        var numTotalLetters = 0;
        this.labelVertexMap = [];
        for (var i = 0; i < pointCount; i++) {
            var label = this.labelStrings[i];
            var vertsArray = [];
            for (var j = 0; j < label.length; j++) {
                for (var k = 0; k < VERTICES_PER_GLYPH; k++) {
                    vertsArray.push(numTotalLetters * VERTICES_PER_GLYPH + k);
                }
                numTotalLetters++;
            }
            this.labelVertexMap.push(vertsArray);
        }
        this.totalVertexCount = numTotalLetters * VERTICES_PER_GLYPH;
    };
    ScatterPlotVisualizer3DLabels.prototype.createColorBuffers = function (pointCount) {
        var _this = this;
        this.pickingColors = new Float32Array(this.totalVertexCount * constants_1.RGB_NUM_ELEMENTS);
        this.renderColors = new Float32Array(this.totalVertexCount * constants_1.RGB_NUM_ELEMENTS);
        var _loop_1 = function (i) {
            var pickingColor = new THREE.Color(i);
            this_1.labelVertexMap[i].forEach(function (j) {
                _this.pickingColors[constants_1.RGB_NUM_ELEMENTS * j] = pickingColor.r;
                _this.pickingColors[constants_1.RGB_NUM_ELEMENTS * j + 1] = pickingColor.g;
                _this.pickingColors[constants_1.RGB_NUM_ELEMENTS * j + 2] = pickingColor.b;
                _this.renderColors[constants_1.RGB_NUM_ELEMENTS * j] = 1.0;
                _this.renderColors[constants_1.RGB_NUM_ELEMENTS * j + 1] = 1.0;
                _this.renderColors[constants_1.RGB_NUM_ELEMENTS * j + 2] = 1.0;
            });
        };
        var this_1 = this;
        for (var i = 0; i < pointCount; i++) {
            _loop_1(i);
        }
    };
    ScatterPlotVisualizer3DLabels.prototype.createLabels = function () {
        var _this = this;
        var _a = this.styles.label3D, fontSize = _a.fontSize, scale = _a.scale;
        if (this.labelStrings == null || this.worldSpacePointPositions == null) {
            return;
        }
        var pointCount = this.worldSpacePointPositions.length / constants_1.XYZ_NUM_ELEMENTS;
        if (pointCount !== this.labelStrings.length) {
            return;
        }
        this.glyphTexture = this.createGlyphTexture();
        this.uniforms = {
            glyphTexture: { value: null },
            picking: { value: false },
        };
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            transparent: true,
            vertexShader: makeVertexShader(fontSize, scale),
            fragmentShader: FRAGMENT_SHADER,
        });
        this.processLabelVerts(pointCount);
        this.createColorBuffers(pointCount);
        var positionArray = new Float32Array(this.totalVertexCount * constants_1.XYZ_NUM_ELEMENTS);
        this.positions = new THREE.BufferAttribute(positionArray, constants_1.XYZ_NUM_ELEMENTS);
        var posArray = new Float32Array(this.totalVertexCount * constants_1.XYZ_NUM_ELEMENTS);
        var uvArray = new Float32Array(this.totalVertexCount * constants_1.UV_NUM_ELEMENTS);
        var colorsArray = new Float32Array(this.totalVertexCount * constants_1.RGB_NUM_ELEMENTS);
        var positionObject = new THREE.BufferAttribute(posArray, 2);
        var uv = new THREE.BufferAttribute(uvArray, constants_1.UV_NUM_ELEMENTS);
        var colors = new THREE.BufferAttribute(colorsArray, constants_1.RGB_NUM_ELEMENTS);
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('posObj', positionObject);
        this.geometry.setAttribute('position', this.positions);
        this.geometry.setAttribute('uv', uv);
        this.geometry.setAttribute('color', colors);
        var lettersSoFar = 0;
        for (var i = 0; i < pointCount; i++) {
            var label = this.labelStrings[i];
            var leftOffset = 0;
            for (var j = 0; j < label.length; j++) {
                var letterCode = label.charCodeAt(j);
                leftOffset += this.glyphTexture.lengths[letterCode];
            }
            leftOffset /= -2;
            for (var j = 0; j < label.length; j++) {
                var letterCode = label.charCodeAt(j);
                var letterWidth = this.glyphTexture.lengths[letterCode];
                var scale_1 = fontSize;
                var right = (leftOffset + letterWidth) / scale_1;
                var left = leftOffset / scale_1;
                var top_1 = fontSize / scale_1;
                positionObject.setXY(lettersSoFar * VERTICES_PER_GLYPH + 0, left, 0);
                positionObject.setXY(lettersSoFar * VERTICES_PER_GLYPH + 1, right, 0);
                positionObject.setXY(lettersSoFar * VERTICES_PER_GLYPH + 2, left, top_1);
                positionObject.setXY(lettersSoFar * VERTICES_PER_GLYPH + 3, left, top_1);
                positionObject.setXY(lettersSoFar * VERTICES_PER_GLYPH + 4, right, 0);
                positionObject.setXY(lettersSoFar * VERTICES_PER_GLYPH + 5, right, top_1);
                var uLeft = this.glyphTexture.offsets[letterCode];
                var uRight = this.glyphTexture.offsets[letterCode] + letterWidth;
                uLeft /= MAX_CANVAS_DIMENSION;
                uRight /= MAX_CANVAS_DIMENSION;
                var vTop = 1;
                var vBottom = 0;
                uv.setXY(lettersSoFar * VERTICES_PER_GLYPH + 0, uLeft, vTop);
                uv.setXY(lettersSoFar * VERTICES_PER_GLYPH + 1, uRight, vTop);
                uv.setXY(lettersSoFar * VERTICES_PER_GLYPH + 2, uLeft, vBottom);
                uv.setXY(lettersSoFar * VERTICES_PER_GLYPH + 3, uLeft, vBottom);
                uv.setXY(lettersSoFar * VERTICES_PER_GLYPH + 4, uRight, vTop);
                uv.setXY(lettersSoFar * VERTICES_PER_GLYPH + 5, uRight, vBottom);
                lettersSoFar++;
                leftOffset += letterWidth;
            }
        }
        var _loop_2 = function (i) {
            var p = util.vector3FromPackedArray(this_2.worldSpacePointPositions, i);
            this_2.labelVertexMap[i].forEach(function (j) {
                _this.positions.setXYZ(j, p.x, p.y, p.z);
            });
        };
        var this_2 = this;
        for (var i = 0; i < pointCount; i++) {
            _loop_2(i);
        }
        this.labelsMesh = new THREE.Mesh(this.geometry, this.material);
        this.labelsMesh.frustumCulled = false;
        this.scene.add(this.labelsMesh);
    };
    ScatterPlotVisualizer3DLabels.prototype.colorLabels = function (pointColors) {
        if (this.labelStrings == null ||
            this.geometry == null ||
            pointColors == null) {
            return;
        }
        var colors = this.geometry.getAttribute('color');
        colors.array = this.renderColors;
        var n = pointColors.length / constants_1.RGBA_NUM_ELEMENTS;
        var src = 0;
        for (var i = 0; i < n; ++i) {
            var c = new THREE.Color(pointColors[src], pointColors[src + 1], pointColors[src + 2]);
            var m = this.labelVertexMap[i].length;
            for (var j = 0; j < m; ++j) {
                colors.setXYZ(this.labelVertexMap[i][j], c.r, c.g, c.b);
            }
            src += constants_1.RGBA_NUM_ELEMENTS;
        }
        colors.needsUpdate = true;
    };
    ScatterPlotVisualizer3DLabels.prototype.setScene = function (scene) {
        this.scene = scene;
    };
    ScatterPlotVisualizer3DLabels.prototype.dispose = function () {
        if (this.labelsMesh) {
            if (this.scene) {
                this.scene.remove(this.labelsMesh);
            }
            this.labelsMesh = null;
        }
        if (this.geometry) {
            this.geometry.dispose();
            this.geometry = null;
        }
        if (this.glyphTexture != null && this.glyphTexture.texture != null) {
            this.glyphTexture.texture.dispose();
            this.glyphTexture.texture = null;
        }
    };
    ScatterPlotVisualizer3DLabels.prototype.onPickingRender = function (rc) {
        if (this.geometry == null) {
            this.createLabels();
            return;
        }
        this.material.uniforms.glyphTexture.value = this.glyphTexture.texture;
        this.material.uniforms.picking.value = true;
        var colors = this.geometry.getAttribute('color');
        colors.array = this.pickingColors;
        colors.needsUpdate = true;
    };
    ScatterPlotVisualizer3DLabels.prototype.onRender = function (rc) {
        if (this.geometry == null) {
            this.createLabels();
            return;
        }
        this.colorLabels(rc.pointColors);
        this.material.uniforms.glyphTexture.value = this.glyphTexture.texture;
        this.material.uniforms.picking.value = false;
        var colors = this.geometry.getAttribute('color');
        colors.array = this.renderColors;
        colors.needsUpdate = true;
    };
    ScatterPlotVisualizer3DLabels.prototype.onPointPositionsChanged = function (newPositions) {
        this.worldSpacePointPositions = newPositions;
        this.dispose();
    };
    ScatterPlotVisualizer3DLabels.prototype.setLabelStrings = function (labelStrings) {
        this.labelStrings = labelStrings;
        this.dispose();
    };
    ScatterPlotVisualizer3DLabels.prototype.onResize = function (newWidth, newHeight) { };
    return ScatterPlotVisualizer3DLabels;
}());
exports.ScatterPlotVisualizer3DLabels = ScatterPlotVisualizer3DLabels;