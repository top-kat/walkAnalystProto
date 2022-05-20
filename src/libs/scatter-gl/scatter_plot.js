"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = require("three");
var OrbitControls_1 = require("three/examples/jsm/controls/OrbitControls");
var render_1 = require("./render");
var util = require("./util");
var scatter_plot_rectangle_selector_1 = require("./scatter_plot_rectangle_selector");
var CUBE_LENGTH = 2;
var MAX_ZOOM = 5 * CUBE_LENGTH;
var MIN_ZOOM = 0.025 * CUBE_LENGTH;
var PERSP_CAMERA_FOV_VERTICAL = 70;
var PERSP_CAMERA_NEAR_CLIP_PLANE = 0.01;
var PERSP_CAMERA_FAR_CLIP_PLANE = 100;
var ORTHO_CAMERA_FRUSTUM_HALF_EXTENT = 1.2;
var SHIFT_KEY = 'Shift';
var CTRL_KEY = 'Control';
var START_CAMERA_POS_3D = new THREE.Vector3(0.45, 0.9, 1.6);
var START_CAMERA_TARGET_3D = new THREE.Vector3(0, 0, 0);
var START_CAMERA_POS_2D = new THREE.Vector3(0, 0, 4);
var START_CAMERA_TARGET_2D = new THREE.Vector3(0, 0, 0);
var DEFAULT_ORBIT_CONTROL_PARAMS = {
    mouseRotateSpeed: 1,
    autoRotateSpeed: 2,
    zoomSpeed: 0.125,
};
var ScatterPlot = (function () {
    function ScatterPlot(containerElement, params) {
        var _this = this;
        this.clickCallback = function () { };
        this.hoverCallback = function () { };
        this.selectCallback = function () { };
        this.selectEnabled = true;
        this.visualizers = new Map();
        this.onCameraMoveListeners = [];
        this.height = 0;
        this.width = 0;
        this.dimensions = 3;
        this.interactionMode = "PAN";
        this.pickingTexture = new THREE.WebGLRenderTarget(0, 0);
        this.orbitAnimationOnNextCameraCreation = false;
        this.orbitAnimationId = null;
        this.worldSpacePointPositions = new Float32Array(0);
        this.pointColors = new Float32Array(0);
        this.pointScaleFactors = new Float32Array(0);
        this.polylineColors = {};
        this.polylineOpacities = new Float32Array(0);
        this.polylineWidths = new Float32Array(0);
        this.selecting = false;
        this.nearestPoint = null;
        this.mouseIsDown = false;
        this.isDragSequence = false;
        this.lastHovered = null;
        this.container = containerElement;
        this.styles = params.styles;
        this.setParameters(params);
        this.computeLayoutValues();
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            premultipliedAlpha: false,
            antialias: false,
        });
        this.renderer.setClearColor(this.styles.backgroundColor, 1);
        this.container.appendChild(this.renderer.domElement);
        this.light = new THREE.PointLight(0xffecbf, 1, 0);
        this.scene.add(this.light);
        this.orbitControlParams = __assign(__assign({}, DEFAULT_ORBIT_CONTROL_PARAMS), params.orbitControlParams);
        this.rectangleSelector = new scatter_plot_rectangle_selector_1.ScatterPlotRectangleSelector(this.container, function (boundingBox) {
            _this.selectBoundingBox(boundingBox);
        }, this.styles);
        this.addInteractionListeners();
        this.setDimensions(3);
        this.makeCamera(params.camera);
        this.resize();
    }
    ScatterPlot.prototype.setParameters = function (p) {
        if (p.onClick !== undefined)
            this.clickCallback = p.onClick;
        if (p.onHover !== undefined)
            this.hoverCallback = p.onHover;
        if (p.onSelect !== undefined)
            this.selectCallback = p.onSelect;
        if (p.selectEnabled !== undefined)
            this.selectEnabled = p.selectEnabled;
    };
    ScatterPlot.prototype.addInteractionListeners = function () {
        this.container.addEventListener('pointermove', this.onMouseMove.bind(this));
        this.container.addEventListener('pointerdown', this.onMouseDown.bind(this));
        this.container.addEventListener('pointerup', this.onMouseUp.bind(this));
        this.container.addEventListener('click', this.onClick.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this), false);
        window.addEventListener('keyup', this.onKeyUp.bind(this), false);
    };
    ScatterPlot.prototype.addCameraControlsEventListeners = function (cameraControls) {
        var _this = this;
        cameraControls.addEventListener('start', function () {
            _this.stopOrbitAnimation();
            _this.onCameraMoveListeners.forEach(function (l) {
                return l(_this.camera.position, cameraControls.target);
            });
        });
        cameraControls.addEventListener('change', function () {
            _this.render();
        });
        cameraControls.addEventListener('end', function () { });
    };
    ScatterPlot.prototype.makeOrbitControls = function (camera, cameraIs3D) {
        if (this.orbitCameraControls != null) {
            this.orbitCameraControls.dispose();
        }
        var occ = new OrbitControls_1.OrbitControls(camera, this.renderer.domElement);
        occ.zoomSpeed = this.orbitControlParams.zoomSpeed;
        occ.enableRotate = cameraIs3D;
        occ.autoRotate = false;
        occ.enableKeys = false;
        occ.rotateSpeed = this.orbitControlParams.mouseRotateSpeed;
        if (cameraIs3D) {
            occ.mouseButtons.LEFT = THREE.MOUSE.LEFT;
            occ.mouseButtons.RIGHT = THREE.MOUSE.RIGHT;
        }
        else {
            occ.mouseButtons.LEFT = THREE.MOUSE.RIGHT;
            occ.mouseButtons.RIGHT = THREE.MOUSE.LEFT;
        }
        occ.reset();
        this.camera = camera;
        this.orbitCameraControls = occ;
        this.addCameraControlsEventListeners(this.orbitCameraControls);
    };
    ScatterPlot.prototype.makeCamera = function (cameraParams) {
        if (cameraParams === void 0) { cameraParams = {}; }
        var def = this.makeDefaultCameraDef(this.dimensions, cameraParams);
        this.recreateCamera(def);
        if (this.dimensions === 3 && this.styles.axesVisible) {
            this.add3dAxes();
        }
        else {
            this.remove3dAxesFromScene();
        }
    };
    ScatterPlot.prototype.makeCamera3D = function (cameraDef, w, h) {
        var camera;
        {
            var aspectRatio = w / h;
            camera = new THREE.PerspectiveCamera(PERSP_CAMERA_FOV_VERTICAL, aspectRatio, PERSP_CAMERA_NEAR_CLIP_PLANE, PERSP_CAMERA_FAR_CLIP_PLANE);
            camera.position.set(cameraDef.position[0], cameraDef.position[1], cameraDef.position[2]);
            var at = new THREE.Vector3(cameraDef.target[0], cameraDef.target[1], cameraDef.target[2]);
            camera.lookAt(at);
            camera.zoom = cameraDef.zoom;
            camera.updateProjectionMatrix();
        }
        this.camera = camera;
        this.makeOrbitControls(camera, true);
    };
    ScatterPlot.prototype.makeCamera2D = function (cameraDef, w, h) {
        var camera;
        var target = new THREE.Vector3(cameraDef.target[0], cameraDef.target[1], cameraDef.target[2]);
        {
            var aspectRatio = w / h;
            var left = -ORTHO_CAMERA_FRUSTUM_HALF_EXTENT;
            var right = ORTHO_CAMERA_FRUSTUM_HALF_EXTENT;
            var bottom = -ORTHO_CAMERA_FRUSTUM_HALF_EXTENT;
            var top_1 = ORTHO_CAMERA_FRUSTUM_HALF_EXTENT;
            if (aspectRatio > 1) {
                left *= aspectRatio;
                right *= aspectRatio;
            }
            else {
                top_1 /= aspectRatio;
                bottom /= aspectRatio;
            }
            camera = new THREE.OrthographicCamera(left, right, top_1, bottom, -1000, 1000);
            camera.position.set(cameraDef.position[0], cameraDef.position[1], cameraDef.position[2]);
            camera.up = new THREE.Vector3(0, 0, 1);
            camera.lookAt(target);
            camera.zoom = cameraDef.zoom;
            camera.updateProjectionMatrix();
        }
        this.camera = camera;
        this.makeOrbitControls(camera, false);
    };
    ScatterPlot.prototype.makeDefaultCameraDef = function (dimensions, cameraParams) {
        if (cameraParams === void 0) { cameraParams = {}; }
        var orthographic = dimensions === 2;
        var position = orthographic ? START_CAMERA_POS_2D : START_CAMERA_POS_3D;
        var target = orthographic
            ? START_CAMERA_TARGET_2D
            : START_CAMERA_TARGET_3D;
        var def = {
            orthographic: orthographic,
            zoom: 1.0,
            position: [position.x, position.y, position.z],
            target: [target.x, target.y, target.z],
        };
        if (cameraParams.zoom)
            def.zoom = cameraParams.zoom;
        if (cameraParams.position)
            def.position = cameraParams.position;
        if (cameraParams.target)
            def.target = cameraParams.target;
        return def;
    };
    ScatterPlot.prototype.recreateCamera = function (cameraDef) {
        if (cameraDef.orthographic) {
            this.makeCamera2D(cameraDef, this.width, this.height);
        }
        else {
            this.makeCamera3D(cameraDef, this.width, this.height);
        }
        this.orbitCameraControls.minDistance = MIN_ZOOM;
        this.orbitCameraControls.maxDistance = MAX_ZOOM;
        this.orbitCameraControls.update();
        if (this.orbitAnimationOnNextCameraCreation) {
            this.startOrbitAnimation();
        }
    };
    ScatterPlot.prototype.setInteractionMode = function (interactionMode) {
        this.interactionMode = interactionMode;
        if (interactionMode === "SELECT") {
            this.selecting = true;
            this.container.style.cursor = 'crosshair';
            this.orbitCameraControls.enabled = false;
        }
        else {
            this.selecting = false;
            this.container.style.cursor = 'default';
            this.orbitCameraControls.enabled = true;
        }
    };
    ScatterPlot.prototype.onClick = function (e, notify) {
        if (notify === void 0) { notify = true; }
        if (e && this.selecting) {
            return;
        }
        if (!this.isDragSequence && notify) {
            if (this.selectEnabled) {
                var selected = this.nearestPoint != null ? [this.nearestPoint] : [];
                this.selectCallback(selected);
            }
            this.clickCallback(this.nearestPoint);
        }
        this.isDragSequence = false;
        this.render();
    };
    ScatterPlot.prototype.onMouseDown = function (e) {
        this.isDragSequence = false;
        this.mouseIsDown = true;
        if (this.selecting) {
            this.rectangleSelector.onMouseDown(e.offsetX, e.offsetY);
            this.setNearestPointToMouse(e);
        }
        else if (!e.ctrlKey &&
            this.sceneIs3D() &&
            this.orbitCameraControls.mouseButtons.ORBIT === THREE.MOUSE.RIGHT) {
            this.orbitCameraControls.mouseButtons.ORBIT = THREE.MOUSE.LEFT;
            this.orbitCameraControls.mouseButtons.PAN = THREE.MOUSE.RIGHT;
        }
        else if (e.ctrlKey &&
            this.sceneIs3D() &&
            this.orbitCameraControls.mouseButtons.ORBIT === THREE.MOUSE.LEFT) {
            this.orbitCameraControls.mouseButtons.ORBIT = THREE.MOUSE.RIGHT;
            this.orbitCameraControls.mouseButtons.PAN = THREE.MOUSE.LEFT;
        }
    };
    ScatterPlot.prototype.onMouseUp = function (e) {
        if (this.selecting) {
            this.rectangleSelector.onMouseUp();
            this.render();
        }
        this.mouseIsDown = false;
    };
    ScatterPlot.prototype.onMouseMove = function (e) {
        this.isDragSequence = this.mouseIsDown;
        if (this.selecting && this.mouseIsDown) {
            this.rectangleSelector.onMouseMove(e.offsetX, e.offsetY);
            this.render();
        }
        else if (!this.mouseIsDown) {
            this.setNearestPointToMouse(e);
            if (this.nearestPoint != this.lastHovered) {
                this.lastHovered = this.nearestPoint;
                this.hoverCallback(this.nearestPoint);
            }
        }
    };
    ScatterPlot.prototype.onKeyDown = function (e) {
        if (e.key === CTRL_KEY && this.sceneIs3D()) {
            this.orbitCameraControls.mouseButtons.ORBIT = THREE.MOUSE.RIGHT;
            this.orbitCameraControls.mouseButtons.PAN = THREE.MOUSE.LEFT;
        }
        if (e.key === SHIFT_KEY && this.selectEnabled) {
            this.selecting = true;
            this.orbitCameraControls.enabled = false;
            this.container.style.cursor = 'crosshair';
        }
    };
    ScatterPlot.prototype.onKeyUp = function (e) {
        if (e.key === CTRL_KEY && this.sceneIs3D()) {
            this.orbitCameraControls.mouseButtons.ORBIT = THREE.MOUSE.LEFT;
            this.orbitCameraControls.mouseButtons.PAN = THREE.MOUSE.RIGHT;
        }
        if (e.key === SHIFT_KEY && this.selectEnabled) {
            this.selecting = false;
            this.orbitCameraControls.enabled = true;
            this.container.style.cursor = 'default';
            this.render();
        }
    };
    ScatterPlot.prototype.getPointIndicesFromBoundingBox = function (boundingBox) {
        if (this.worldSpacePointPositions == null) {
            return [];
        }
        this.camera.updateMatrixWorld();
        var dpr = window.devicePixelRatio || 1;
        var selectionX = Math.floor(boundingBox.x * dpr);
        var selectionY = Math.floor(boundingBox.y * dpr);
        var selectionWidth = Math.max(Math.floor(boundingBox.width * dpr), 1);
        var selectionHeight = Math.max(Math.floor(boundingBox.height * dpr), 1);
        if (selectionWidth <= 2 && selectionHeight <= 2) {
            return this.getPointIndicesFromBoundingBoxPickingTexture(boundingBox);
        }
        var canvas = this.renderer.domElement;
        var canvasWidth = canvas.width;
        var canvasHeight = canvas.height;
        var pointIndices = [];
        var vector3 = new THREE.Vector3();
        for (var i = 0; i < this.worldSpacePointPositions.length; i++) {
            var start = i * 3;
            var _a = __read(this.worldSpacePointPositions.slice(start, start + 3), 3), worldX = _a[0], worldY = _a[1], worldZ = _a[2];
            vector3.x = worldX;
            vector3.y = worldY;
            vector3.z = worldZ;
            var screenVector = vector3.project(this.camera);
            var x = ((screenVector.x + 1) * canvasWidth) / 2;
            var y = (-(screenVector.y - 1) * canvasHeight) / 2;
            if (x >= selectionX && x <= selectionX + selectionWidth) {
                if (y <= selectionY && y >= selectionY - selectionHeight) {
                    pointIndices.push(i);
                }
            }
        }
        return pointIndices;
    };
    ScatterPlot.prototype.getPointIndicesFromBoundingBoxPickingTexture = function (boundingBox) {
        if (this.worldSpacePointPositions == null) {
            return [];
        }
        var pointCount = this.worldSpacePointPositions.length / 3;
        var dpr = window.devicePixelRatio || 1;
        var x = Math.floor(boundingBox.x * dpr);
        var y = Math.floor(boundingBox.y * dpr);
        var width = Math.max(Math.floor(boundingBox.width * dpr), 1);
        var height = Math.max(Math.floor(boundingBox.height * dpr), 1);
        var pixelBuffer = new Uint8Array(width * height * 4);
        this.renderer.readRenderTargetPixels(this.pickingTexture, x, this.pickingTexture.height - y, width, height, pixelBuffer);
        var pointIndicesSelection = new Uint8Array(this.worldSpacePointPositions.length);
        for (var i = 0; i < width * height; i++) {
            var id = (pixelBuffer[i * 4] << 16) |
                (pixelBuffer[i * 4 + 1] << 8) |
                pixelBuffer[i * 4 + 2];
            if (id !== 0xffffff && id < pointCount) {
                pointIndicesSelection[id] = 1;
            }
        }
        var pointIndices = [];
        for (var i = 0; i < pointIndicesSelection.length; i++) {
            if (pointIndicesSelection[i] === 1) {
                pointIndices.push(i);
            }
        }
        return pointIndices;
    };
    ScatterPlot.prototype.selectBoundingBox = function (boundingBox) {
        var pointIndices = this.getPointIndicesFromBoundingBox(boundingBox);
        this.selectCallback(pointIndices);
    };
    ScatterPlot.prototype.setNearestPointToMouse = function (e) {
        if (this.pickingTexture == null) {
            this.nearestPoint = null;
            return;
        }
        var boundingBox = {
            x: e.offsetX,
            y: e.offsetY,
            width: 1,
            height: 1,
        };
        var pointIndices = this.getPointIndicesFromBoundingBoxPickingTexture(boundingBox);
        this.nearestPoint = pointIndices.length ? pointIndices[0] : null;
    };
    ScatterPlot.prototype.computeLayoutValues = function () {
        this.width = this.container.offsetWidth;
        this.height = Math.max(1, this.container.offsetHeight);
        return [this.width, this.height];
    };
    ScatterPlot.prototype.sceneIs3D = function () {
        return this.dimensions === 3;
    };
    ScatterPlot.prototype.remove3dAxesFromScene = function () {
        var axes = this.scene.getObjectByName('axes');
        if (axes != null) {
            this.scene.remove(axes);
        }
        return axes;
    };
    ScatterPlot.prototype.add3dAxes = function () {
        var axes = new THREE.AxesHelper();
        axes.name = 'axes';
        this.scene.add(axes);
    };
    ScatterPlot.prototype.setDimensions = function (dimensions) {
        if (dimensions !== 2 && dimensions !== 3) {
            throw new RangeError('dimensions must be 2 or 3');
        }
        if (this.dimensions !== dimensions) {
            this.dimensions = dimensions;
            this.makeCamera();
        }
    };
    ScatterPlot.prototype.getCameraPosition = function () {
        var currPos = this.camera.position;
        return [currPos.x, currPos.y, currPos.z];
    };
    ScatterPlot.prototype.getCameraTarget = function () {
        var currTarget = this.orbitCameraControls.target;
        return [currTarget.x, currTarget.y, currTarget.z];
    };
    ScatterPlot.prototype.setCameraPositionAndTarget = function (position, target) {
        this.stopOrbitAnimation();
        this.camera.position.set(position[0], position[1], position[2]);
        this.orbitCameraControls.target.set(target[0], target[1], target[2]);
        this.orbitCameraControls.update();
        this.render();
    };
    ScatterPlot.prototype.startOrbitAnimation = function () {
        if (!this.sceneIs3D()) {
            return;
        }
        if (this.orbitAnimationId != null) {
            this.stopOrbitAnimation();
        }
        this.orbitCameraControls.autoRotate = true;
        this.orbitCameraControls.autoRotateSpeed = this.orbitControlParams.autoRotateSpeed;
        this.updateOrbitAnimation();
    };
    ScatterPlot.prototype.orbitIsAnimating = function () {
        return this.orbitAnimationId != null;
    };
    ScatterPlot.prototype.updateOrbitAnimation = function () {
        var _this = this;
        this.orbitCameraControls.update();
        this.orbitAnimationId = requestAnimationFrame(function () {
            return _this.updateOrbitAnimation();
        });
    };
    ScatterPlot.prototype.stopOrbitAnimation = function () {
        this.orbitCameraControls.autoRotate = false;
        this.orbitCameraControls.rotateSpeed = this.orbitControlParams.mouseRotateSpeed;
        if (this.orbitAnimationId != null) {
            cancelAnimationFrame(this.orbitAnimationId);
            this.orbitAnimationId = null;
        }
    };
    ScatterPlot.prototype.setActiveVisualizers = function (visualizers) {
        var e_1, _a, e_2, _b;
        var nextVisualizerIds = new Set(visualizers.map(function (v) { return v.id; }));
        try {
            for (var _c = __values(this.visualizers.values()), _d = _c.next(); !_d.done; _d = _c.next()) {
                var visualizer = _d.value;
                if (!nextVisualizerIds.has(visualizer.id)) {
                    visualizer.dispose();
                    this.visualizers.delete(visualizer.id);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        try {
            for (var visualizers_1 = __values(visualizers), visualizers_1_1 = visualizers_1.next(); !visualizers_1_1.done; visualizers_1_1 = visualizers_1.next()) {
                var visualizer = visualizers_1_1.value;
                this.visualizers.set(visualizer.id, visualizer);
                visualizer.setScene(this.scene);
                visualizer.onResize(this.width, this.height);
                if (this.worldSpacePointPositions) {
                    visualizer.onPointPositionsChanged(this.worldSpacePointPositions);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (visualizers_1_1 && !visualizers_1_1.done && (_b = visualizers_1.return)) _b.call(visualizers_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
    ScatterPlot.prototype.disposeAllVisualizers = function () {
        this.visualizers.forEach(function (v) { return v.dispose(); });
        this.visualizers.clear();
    };
    ScatterPlot.prototype.setPointPositions = function (worldSpacePointPositions) {
        this.worldSpacePointPositions = worldSpacePointPositions;
        this.visualizers.forEach(function (v) {
            return v.onPointPositionsChanged(worldSpacePointPositions);
        });
    };
    ScatterPlot.prototype.render = function () {
        {
            var lightPos = this.camera.position.clone();
            lightPos.x += 1;
            lightPos.y += 1;
            this.light.position.set(lightPos.x, lightPos.y, lightPos.z);
        }
        var cameraType = this.camera instanceof THREE.PerspectiveCamera
            ? render_1.CameraType.Perspective
            : render_1.CameraType.Orthographic;
        var cameraSpacePointExtents = [0, 0];
        if (this.worldSpacePointPositions != null) {
            cameraSpacePointExtents = util.getNearFarPoints(this.worldSpacePointPositions, this.camera.position, this.orbitCameraControls.target);
        }
        var rc = new render_1.RenderContext(this.camera, cameraType, this.orbitCameraControls.target, this.width, this.height, cameraSpacePointExtents[0], cameraSpacePointExtents[1], this.styles.backgroundColor, this.pointColors, this.pointScaleFactors, this.labels, this.polylineColors, this.polylineOpacities, this.polylineWidths);
        this.visualizers.forEach(function (v) { return v.onPickingRender(rc); });
        {
            var axes = this.remove3dAxesFromScene();
            this.renderer.setRenderTarget(this.pickingTexture);
            this.renderer.render(this.scene, this.camera);
            if (axes != null) {
                this.scene.add(axes);
            }
        }
        this.visualizers.forEach(function (v) { return v.onRender(rc); });
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.scene, this.camera);
    };
    ScatterPlot.prototype.setPointColors = function (colors) {
        this.pointColors = colors;
    };
    ScatterPlot.prototype.setPointScaleFactors = function (scaleFactors) {
        this.pointScaleFactors = scaleFactors;
    };
    ScatterPlot.prototype.setLabels = function (labels) {
        this.labels = labels;
    };
    ScatterPlot.prototype.setPolylineColors = function (colors) {
        this.polylineColors = colors;
    };
    ScatterPlot.prototype.setPolylineOpacities = function (opacities) {
        this.polylineOpacities = opacities;
    };
    ScatterPlot.prototype.setPolylineWidths = function (widths) {
        this.polylineWidths = widths;
    };
    ScatterPlot.prototype.resetZoom = function () {
        this.recreateCamera(this.makeDefaultCameraDef(this.dimensions));
        this.render();
    };
    ScatterPlot.prototype.setDayNightMode = function (isNight) {
        var canvases = this.container.querySelectorAll('canvas');
        var filterValue = isNight ? 'invert(100%)' : '';
        for (var i = 0; i < canvases.length; i++) {
            canvases[i].style.filter = filterValue;
        }
    };
    ScatterPlot.prototype.resize = function (render) {
        if (render === void 0) { render = true; }
        var _a = __read([this.width, this.height], 2), oldW = _a[0], oldH = _a[1];
        var _b = __read(this.computeLayoutValues(), 2), newW = _b[0], newH = _b[1];
        if (this.dimensions === 3) {
            var camera = this.camera;
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
        }
        else {
            var camera = this.camera;
            var scaleW = newW / oldW;
            var scaleH = newH / oldH;
            var newCamHalfWidth = ((camera.right - camera.left) * scaleW) / 2;
            var newCamHalfHeight = ((camera.top - camera.bottom) * scaleH) / 2;
            camera.top = newCamHalfHeight;
            camera.bottom = -newCamHalfHeight;
            camera.left = -newCamHalfWidth;
            camera.right = newCamHalfWidth;
            camera.updateProjectionMatrix();
        }
        var dpr = window.devicePixelRatio || 1;
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(newW, newH);
        {
            var renderCanvasSize = new THREE.Vector2();
            this.renderer.getSize(renderCanvasSize);
            var pixelRatio = this.renderer.getPixelRatio();
            this.pickingTexture = new THREE.WebGLRenderTarget(renderCanvasSize.width * pixelRatio, renderCanvasSize.height * pixelRatio);
            this.pickingTexture.texture.minFilter = THREE.LinearFilter;
        }
        this.visualizers.forEach(function (v) { return v.onResize(newW, newH); });
        if (render) {
            this.render();
        }
    };
    ScatterPlot.prototype.onCameraMove = function (listener) {
        this.onCameraMoveListeners.push(listener);
    };
    ScatterPlot.prototype.clickOnPoint = function (pointIndex) {
        this.nearestPoint = pointIndex;
        this.onClick(null, false);
    };
    return ScatterPlot;
}());
exports.ScatterPlot = ScatterPlot;
