"use strict";
var __values = (this && this.__values) || function (o) {
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
var util = require("./util");
var constants_1 = require("./constants");
var ScatterPlotVisualizerPolylines = (function () {
    function ScatterPlotVisualizerPolylines() {
        this.id = 'POLYLINES';
        this.sequences = [];
        this.polylines = [];
        this.polylinePositionBuffer = {};
        this.polylineColorBuffer = {};
        this.pointSequenceIndices = new Map();
    }
    ScatterPlotVisualizerPolylines.prototype.getPointSequenceIndex = function (pointIndex) {
        return this.pointSequenceIndices.get(pointIndex);
    };
    ScatterPlotVisualizerPolylines.prototype.updateSequenceIndices = function () {
        for (var i = 0; i < this.sequences.length; i++) {
            var sequence = this.sequences[i];
            for (var j = 0; j < sequence.indices.length - 1; j++) {
                var pointIndex = sequence.indices[j];
                this.pointSequenceIndices.set(pointIndex, i);
                this.pointSequenceIndices.set(pointIndex + 1, i);
            }
        }
    };
    ScatterPlotVisualizerPolylines.prototype.createPolylines = function () {
        var e_1, _a;
        this.updateSequenceIndices();
        try {
            for (var _b = __values(this.polylines), _c = _b.next(); !_c.done; _c = _b.next()) {
                var polyline = _c.value;
                this.scene.remove(polyline);
                polyline.geometry.dispose();
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.polylines = [];
        for (var i = 0; i < this.sequences.length; i++) {
            var geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', this.polylinePositionBuffer[i]);
            geometry.setAttribute('color', this.polylineColorBuffer[i]);
            var material = new THREE.LineBasicMaterial({
                linewidth: 1,
                opacity: 1.0,
                transparent: true,
                vertexColors: true,
            });
            var polyline = new THREE.LineSegments(geometry, material);
            polyline.frustumCulled = false;
            this.polylines.push(polyline);
            this.scene.add(polyline);
        }
    };
    ScatterPlotVisualizerPolylines.prototype.dispose = function () {
        var e_2, _a;
        try {
            for (var _b = __values(this.polylines), _c = _b.next(); !_c.done; _c = _b.next()) {
                var polyline = _c.value;
                this.scene.remove(polyline);
                polyline.geometry.dispose();
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        this.polylines = [];
        this.polylinePositionBuffer = {};
        this.polylineColorBuffer = {};
    };
    ScatterPlotVisualizerPolylines.prototype.setScene = function (scene) {
        this.scene = scene;
    };
    ScatterPlotVisualizerPolylines.prototype.setSequences = function (sequences) {
        this.sequences = sequences;
    };
    ScatterPlotVisualizerPolylines.prototype.onPointPositionsChanged = function (newPositions) {
        if (newPositions == null)
            this.dispose();
        if (newPositions == null || this.sequences.length === 0) {
            return;
        }
        for (var i = 0; i < this.sequences.length; i++) {
            var sequence = this.sequences[i];
            var vertexCount = 2 * (sequence.indices.length - 1);
            var polylines = new Float32Array(vertexCount * constants_1.XYZ_NUM_ELEMENTS);
            this.polylinePositionBuffer[i] = new THREE.BufferAttribute(polylines, constants_1.XYZ_NUM_ELEMENTS);
            var colors = new Float32Array(vertexCount * constants_1.RGBA_NUM_ELEMENTS);
            this.polylineColorBuffer[i] = new THREE.BufferAttribute(colors, constants_1.RGBA_NUM_ELEMENTS);
        }
        for (var i = 0; i < this.sequences.length; i++) {
            var sequence = this.sequences[i];
            var src = 0;
            for (var j = 0; j < sequence.indices.length - 1; j++) {
                var p1Index = sequence.indices[j];
                var p2Index = sequence.indices[j + 1];
                var p1 = util.vector3FromPackedArray(newPositions, p1Index);
                var p2 = util.vector3FromPackedArray(newPositions, p2Index);
                this.polylinePositionBuffer[i].setXYZ(src, p1.x, p1.y, p1.z);
                this.polylinePositionBuffer[i].setXYZ(src + 1, p2.x, p2.y, p2.z);
                src += 2;
            }
            this.polylinePositionBuffer[i].needsUpdate = true;
        }
        this.createPolylines();
    };
    ScatterPlotVisualizerPolylines.prototype.onRender = function (renderContext) {
        for (var i = 0; i < this.polylines.length; i++) {
            var material = this.polylines[i].material;
            material.opacity = renderContext.polylineOpacities[i];
            material.linewidth = renderContext.polylineWidths[i];
            this.polylineColorBuffer[i].array = renderContext.polylineColors[i];
            this.polylineColorBuffer[i].needsUpdate = true;
        }
    };
    ScatterPlotVisualizerPolylines.prototype.onPickingRender = function (renderContext) { };
    ScatterPlotVisualizerPolylines.prototype.onResize = function (newWidth, newHeight) { };
    return ScatterPlotVisualizerPolylines;
}());
exports.ScatterPlotVisualizerPolylines = ScatterPlotVisualizerPolylines;
