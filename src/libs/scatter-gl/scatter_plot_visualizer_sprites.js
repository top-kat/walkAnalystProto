"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = require("three");
var render_1 = require("./render");
var util = require("./util");
var constants_1 = require("./constants");
var makeVertexShader = function (minPointSize) { return "\n    // Index of the specific vertex (passed in as bufferAttribute), and the\n    // variable that will be used to pass it to the fragment shader.\n    attribute float spriteIndex;\n    attribute vec4 color;\n    attribute float scaleFactor;\n\n    varying vec2 xyIndex;\n    varying vec4 vColor;\n\n    uniform bool sizeAttenuation;\n    uniform float pointSize;\n    uniform float spritesPerRow;\n    uniform float spritesPerColumn;\n\n    varying float fogDepth;\n\n    void main() {\n      // Pass index and color values to fragment shader.\n      vColor = color;\n      xyIndex = vec2(mod(spriteIndex, spritesPerRow),\n                floor(spriteIndex / spritesPerColumn));\n\n      // Transform current vertex by modelViewMatrix (model world position and\n      // camera world position matrix).\n      vec4 cameraSpacePos = modelViewMatrix * vec4(position, 1.0);\n\n      // Project vertex in camera-space to screen coordinates using the camera's\n      // projection matrix.\n      gl_Position = projectionMatrix * cameraSpacePos;\n\n      // Create size attenuation (if we're in 3D mode) by making the size of\n      // each point inversly proportional to its distance to the camera.\n      float outputPointSize = pointSize;\n      if (sizeAttenuation) {\n        outputPointSize = -pointSize / cameraSpacePos.z;\n        fogDepth = pointSize / outputPointSize * 1.2;\n      } else {  // Create size attenuation (if we're in 2D mode)\n        const float PI = 3.1415926535897932384626433832795;\n        const float minScale = 0.1;  // minimum scaling factor\n        const float outSpeed = 2.0;  // shrink speed when zooming out\n        const float outNorm = (1. - minScale) / atan(outSpeed);\n        const float maxScale = 15.0;  // maximum scaling factor\n        const float inSpeed = 0.02;  // enlarge speed when zooming in\n        const float zoomOffset = 0.3;  // offset zoom pivot\n        float zoom = projectionMatrix[0][0] + zoomOffset;  // zoom pivot\n        float scale = zoom < 1. ? 1. + outNorm * atan(outSpeed * (zoom - 1.)) :\n                      1. + 2. / PI * (maxScale - 1.) * atan(inSpeed * (zoom - 1.));\n        outputPointSize = pointSize * scale;\n      }\n\n      gl_PointSize =\n        max(outputPointSize * scaleFactor, " + minPointSize.toFixed(1) + ");\n    }"; };
var FRAGMENT_SHADER_POINT_TEST_CHUNK = "\n    bool point_in_unit_circle(vec2 spriteCoord) {\n      vec2 centerToP = spriteCoord - vec2(0.5, 0.5);\n      return dot(centerToP, centerToP) < (0.5 * 0.5);\n    }\n\n    bool point_in_unit_equilateral_triangle(vec2 spriteCoord) {\n      vec3 v0 = vec3(0, 1, 0);\n      vec3 v1 = vec3(0.5, 0, 0);\n      vec3 v2 = vec3(1, 1, 0);\n      vec3 p = vec3(spriteCoord, 0);\n      float p_in_v0_v1 = cross(v1 - v0, p - v0).z;\n      float p_in_v1_v2 = cross(v2 - v1, p - v1).z;\n      return (p_in_v0_v1 > 0.0) && (p_in_v1_v2 > 0.0);\n    }\n\n    bool point_in_unit_square(vec2 spriteCoord) {\n      return true;\n    }\n  ";
var FRAGMENT_SHADER = "\n    varying vec2 xyIndex;\n    varying vec4 vColor;\n\n    uniform sampler2D spriteTexture;\n    uniform float spritesPerRow;\n    uniform float spritesPerColumn;\n    uniform bool isImage;\n\n    " + THREE.ShaderChunk['common'] + "\n    " + FRAGMENT_SHADER_POINT_TEST_CHUNK + "\n    uniform vec3 fogColor;\n    varying float fogDepth;\n\t\tuniform float fogNear;\n    uniform float fogFar;\n\n    void main() {\n      if (isImage) {\n        // Coordinates of the vertex within the entire sprite image.\n        vec2 coords =\n          (gl_PointCoord + xyIndex) / vec2(spritesPerRow, spritesPerColumn);\n        gl_FragColor = vColor * texture(spriteTexture, coords);\n      } else {\n        bool inside = point_in_unit_circle(gl_PointCoord);\n        if (!inside) {\n          discard;\n        }\n        gl_FragColor = vColor;\n      }\n      float fogFactor = smoothstep( fogNear, fogFar, fogDepth );\n      gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );\n    }";
var FRAGMENT_SHADER_PICKING = "\n    varying vec2 xyIndex;\n    varying vec4 vColor;\n    uniform bool isImage;\n\n    " + FRAGMENT_SHADER_POINT_TEST_CHUNK + "\n\n    varying float fogDepth;\n\n    void main() {\n      xyIndex; // Silence 'unused variable' warning.\n      fogDepth; // Silence 'unused variable' warning.\n      if (isImage) {\n        gl_FragColor = vColor;\n      } else {\n        bool inside = point_in_unit_circle(gl_PointCoord);\n        if (!inside) {\n          discard;\n        }\n        gl_FragColor = vColor;\n      }\n    }";
var ScatterPlotVisualizerSprites = (function () {
    function ScatterPlotVisualizerSprites(styles, spriteSheetParams) {
        this.styles = styles;
        this.id = 'SPRITES';
        this.isSpriteSheetMode = false;
        this.spritesPerRow = 0;
        this.spritesPerColumn = 0;
        this.spriteDimensions = [0, 0];
        this.worldSpacePointPositions = new Float32Array(0);
        this.pickingColors = new Float32Array(0);
        this.renderColors = new Float32Array(0);
        this.standinTextureForPoints = util.createTextureFromCanvas(document.createElement('canvas'));
        if (spriteSheetParams) {
            this.spriteSheetParams = spriteSheetParams;
            this.setSpriteSheet(spriteSheetParams);
            this.isSpriteSheetMode = true;
        }
        this.renderMaterial = this.createRenderMaterial();
        this.pickingMaterial = this.createPickingMaterial();
    }
    ScatterPlotVisualizerSprites.prototype.createUniforms = function () {
        return {
            spriteTexture: { type: 't' },
            spritesPerRow: { type: 'f' },
            spritesPerColumn: { type: 'f' },
            fogColor: { type: 'c' },
            fogNear: { type: 'f' },
            fogFar: { type: 'f' },
            isImage: { type: 'bool' },
            sizeAttenuation: { type: 'bool' },
            pointSize: { type: 'f' },
        };
    };
    ScatterPlotVisualizerSprites.prototype.createRenderMaterial = function () {
        var isSpriteSheetMode = this.isSpriteSheetMode;
        var uniforms = this.createUniforms();
        return new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: makeVertexShader(this.styles.sprites.minPointSize),
            fragmentShader: FRAGMENT_SHADER,
            transparent: true,
            depthFunc: THREE.LessDepth,
            fog: this.styles.fog.enabled,
            blending: THREE.NormalBlending,
        });
    };
    ScatterPlotVisualizerSprites.prototype.createPickingMaterial = function () {
        var uniforms = this.createUniforms();
        return new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: makeVertexShader(this.styles.sprites.minPointSize),
            fragmentShader: FRAGMENT_SHADER_PICKING,
            transparent: true,
            depthTest: true,
            depthWrite: true,
            fog: false,
            blending: THREE.NormalBlending,
        });
    };
    ScatterPlotVisualizerSprites.prototype.createPointSprites = function (scene, positions) {
        var pointCount = positions != null ? positions.length / constants_1.XYZ_NUM_ELEMENTS : 0;
        var geometry = this.createGeometry(pointCount);
        this.fog = new THREE.Fog(0xffffff);
        this.points = new THREE.Points(geometry, this.renderMaterial);
        this.points.frustumCulled = false;
        if (this.spriteIndexBufferAttribute != null) {
            this.points.geometry.setAttribute('spriteIndex', this.spriteIndexBufferAttribute);
        }
        scene.add(this.points);
    };
    ScatterPlotVisualizerSprites.prototype.calculatePointSize = function (sceneIs3D) {
        var imageSize = this.styles.sprites.imageSize;
        if (this.texture) {
            return sceneIs3D ? imageSize : this.spriteDimensions[0];
        }
        var n = this.worldSpacePointPositions != null
            ? this.worldSpacePointPositions.length / constants_1.XYZ_NUM_ELEMENTS
            : 1;
        var SCALE = 200;
        var LOG_BASE = 8;
        var DIVISOR = 1.5;
        var pointSize = SCALE / Math.log(n) / Math.log(LOG_BASE);
        return sceneIs3D ? pointSize : pointSize / DIVISOR;
    };
    ScatterPlotVisualizerSprites.prototype.createGeometry = function (pointCount) {
        var n = pointCount;
        this.pickingColors = new Float32Array(n * constants_1.RGBA_NUM_ELEMENTS);
        {
            var dst = 0;
            for (var i = 0; i < n; i++) {
                var c = new THREE.Color(i);
                this.pickingColors[dst++] = c.r;
                this.pickingColors[dst++] = c.g;
                this.pickingColors[dst++] = c.b;
                this.pickingColors[dst++] = 1;
            }
        }
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([]), constants_1.XYZ_NUM_ELEMENTS));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array([]), constants_1.RGBA_NUM_ELEMENTS));
        geometry.setAttribute('scaleFactor', new THREE.BufferAttribute(new Float32Array([]), constants_1.INDEX_NUM_ELEMENTS));
        geometry.computeVertexNormals();
        return geometry;
    };
    ScatterPlotVisualizerSprites.prototype.setFogDistances = function (sceneIs3D, nearestPointZ, farthestPointZ) {
        var _a = this.styles.fog, threshold = _a.threshold, enabled = _a.enabled;
        if (sceneIs3D && enabled) {
            this.fog.near = nearestPointZ;
            var delta = nearestPointZ - farthestPointZ;
            this.fog.far = nearestPointZ - threshold * delta;
        }
        else {
            this.fog.near = Infinity;
            this.fog.far = Infinity;
        }
    };
    ScatterPlotVisualizerSprites.prototype.dispose = function () {
        this.disposeGeometry();
        this.disposeSpriteSheet();
    };
    ScatterPlotVisualizerSprites.prototype.disposeGeometry = function () {
        if (this.points != null) {
            this.scene.remove(this.points);
            this.points.geometry.dispose();
            this.points = null;
            this.worldSpacePointPositions = null;
        }
    };
    ScatterPlotVisualizerSprites.prototype.disposeSpriteSheet = function () {
        if (this.texture) {
            this.texture.dispose();
        }
        this.texture = null;
        this.renderMaterial = null;
        this.pickingMaterial = null;
        this.spriteSheetImage = null;
    };
    ScatterPlotVisualizerSprites.prototype.setScene = function (scene) {
        this.scene = scene;
    };
    ScatterPlotVisualizerSprites.prototype.setSpriteSheet = function (spriteSheetParams) {
        var _this = this;
        var spriteDimensions = spriteSheetParams.spriteDimensions, onImageLoad = spriteSheetParams.onImageLoad;
        var spriteSheet = spriteSheetParams.spritesheetImage;
        if (typeof spriteSheet === 'string') {
            var spriteSheetUrl = spriteSheet;
            spriteSheet = new Image();
            spriteSheet.src = spriteSheetUrl;
        }
        this.spriteSheetImage = spriteSheet;
        this.texture = util.createTextureFromImage(this.spriteSheetImage, function () {
            _this.spritesPerRow = _this.spriteSheetImage.width / spriteDimensions[0];
            _this.spritesPerColumn =
                _this.spriteSheetImage.height / spriteDimensions[1];
            onImageLoad();
        });
        this.spriteDimensions = spriteDimensions;
        this.setSpriteIndexBuffer();
    };
    ScatterPlotVisualizerSprites.prototype.setSpriteIndexBuffer = function () {
        var spriteIndices = this.spriteSheetParams.spriteIndices;
        this.spriteIndexBufferAttribute = new THREE.BufferAttribute(spriteIndices, constants_1.INDEX_NUM_ELEMENTS);
        if (this.points != null) {
            this.points.geometry.setAttribute('spriteIndex', this.spriteIndexBufferAttribute);
        }
    };
    ScatterPlotVisualizerSprites.prototype.onPointPositionsChanged = function (newPositions) {
        if (this.points != null) {
            if (this.worldSpacePointPositions.length !== newPositions.length) {
                this.disposeGeometry();
            }
        }
        this.worldSpacePointPositions = newPositions;
        if (this.points == null) {
            this.createPointSprites(this.scene, newPositions);
        }
        if (this.spriteSheetParams) {
            this.setSpriteIndexBuffer();
        }
        this.renderMaterial = this.createRenderMaterial();
        this.pickingMaterial = this.createPickingMaterial();
        var positions = this.points
            .geometry.getAttribute('position');
        positions.array = newPositions;
        positions.count = newPositions.length / constants_1.XYZ_NUM_ELEMENTS;
        positions.needsUpdate = true;
    };
    ScatterPlotVisualizerSprites.prototype.onPickingRender = function (rc) {
        var sceneIs3D = rc.cameraType === render_1.CameraType.Perspective;
        this.pickingMaterial.uniforms.spritesPerRow.value = this.spritesPerRow;
        this.pickingMaterial.uniforms.spritesPerRow.value = this.spritesPerColumn;
        this.pickingMaterial.uniforms.sizeAttenuation.value = sceneIs3D;
        this.pickingMaterial.uniforms.pointSize.value = this.calculatePointSize(sceneIs3D);
        this.points.material = this.pickingMaterial;
        var colors = this.points.geometry.getAttribute('color');
        colors.array = this.pickingColors;
        colors.count = this.pickingColors.length / constants_1.RGBA_NUM_ELEMENTS;
        colors.needsUpdate = true;
        var scaleFactors = this.points
            .geometry.getAttribute('scaleFactor');
        scaleFactors.array = rc.pointScaleFactors;
        scaleFactors.count = rc.pointScaleFactors.length;
        scaleFactors.count = rc.pointScaleFactors.length / constants_1.INDEX_NUM_ELEMENTS;
        scaleFactors.needsUpdate = true;
    };
    ScatterPlotVisualizerSprites.prototype.onRender = function (rc) {
        var sceneIs3D = rc.camera instanceof THREE.PerspectiveCamera;
        this.setFogDistances(sceneIs3D, rc.nearestCameraSpacePointZ, rc.farthestCameraSpacePointZ);
        this.scene.fog = this.fog;
        this.scene.fog.color = new THREE.Color(rc.backgroundColor);
        this.renderMaterial.uniforms.fogColor.value = this.scene.fog.color;
        this.renderMaterial.uniforms.fogNear.value = this.fog.near;
        this.renderMaterial.uniforms.fogFar.value = this.fog.far;
        this.renderMaterial.uniforms.spritesPerRow.value = this.spritesPerRow;
        this.renderMaterial.uniforms.spritesPerColumn.value = this.spritesPerColumn;
        this.renderMaterial.uniforms.isImage.value = this.texture != null;
        this.renderMaterial.uniforms.spriteTexture.value =
            this.texture != null ? this.texture : this.standinTextureForPoints;
        this.renderMaterial.uniforms.sizeAttenuation.value = sceneIs3D;
        this.renderMaterial.uniforms.pointSize.value = this.calculatePointSize(sceneIs3D);
        this.points.material = this.renderMaterial;
        var colors = this.points.geometry.getAttribute('color');
        this.renderColors = rc.pointColors;
        colors.array = this.renderColors;
        colors.count = this.renderColors.length / constants_1.RGBA_NUM_ELEMENTS;
        colors.needsUpdate = true;
        var scaleFactors = this.points
            .geometry.getAttribute('scaleFactor');
        scaleFactors.array = rc.pointScaleFactors;
        scaleFactors.count = rc.pointScaleFactors.length / constants_1.INDEX_NUM_ELEMENTS;
        scaleFactors.needsUpdate = true;
    };
    ScatterPlotVisualizerSprites.prototype.onResize = function (newWidth, newHeight) { };
    return ScatterPlotVisualizerSprites;
}());
exports.ScatterPlotVisualizerSprites = ScatterPlotVisualizerSprites;