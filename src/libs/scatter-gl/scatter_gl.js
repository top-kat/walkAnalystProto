"use strict";
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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
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
var scatter_plot_1 = require("./scatter_plot");
var color_1 = require("./color");
var data_1 = require("./data");
var render_1 = require("./render");
var styles_1 = require("./styles");
var util = require("./util");
var constants_1 = require("./constants");
var scatter_plot_visualizer_3d_labels_1 = require("./scatter_plot_visualizer_3d_labels");
var scatter_plot_visualizer_sprites_1 = require("./scatter_plot_visualizer_sprites");
var scatter_plot_visualizer_canvas_labels_1 = require("./scatter_plot_visualizer_canvas_labels");
var scatter_plot_visualizer_polylines_1 = require("./scatter_plot_visualizer_polylines");
var ScatterGL = (function () {
    function ScatterGL(containerElement, params) {
        var _this = this;
        if (params === void 0) { params = {}; }
        this.pointColorer = null;
        this.sequences = [];
        this.renderMode = "POINT";
        this.rotateOnStart = true;
        this.selectEnabled = true;
        this.showLabelsOnHover = true;
        this.hoverPointIndex = null;
        this.selectedPointIndices = new Set();
        this.clickCallback = function () { };
        this.hoverCallback = function () { };
        this.selectCallback = function () { };
        this.cameraMoveCallback = function () { };
        this.onHover = function (pointIndex) {
            _this.hoverCallback(pointIndex);
            _this.hoverPointIndex = pointIndex;
            _this.updateScatterPlotAttributes();
            _this.renderScatterPlot();
        };
        this.onClick = function (pointIndex) {
            _this.clickCallback(pointIndex);
        };
        this.select = function (pointIndices) {
            if (!_this.selectEnabled)
                return;
            _this.selectedPointIndices = new Set(pointIndices);
            _this.updateScatterPlotAttributes();
            _this.renderScatterPlot();
        };
        this.onSelect = function (pointIndices) {
            if (!_this.selectEnabled)
                return;
            _this.selectCallback(pointIndices);
            _this.select(pointIndices);
        };
        this.containerElement = containerElement;
        this.styles = styles_1.makeStyles(params.styles);
        this.setParameters(params);
        this.scatterPlot = new scatter_plot_1.ScatterPlot(containerElement, {
            camera: params.camera,
            onClick: this.onClick,
            onHover: this.onHover,
            onSelect: this.onSelect,
            selectEnabled: this.selectEnabled,
            styles: this.styles,
            orbitControlParams: params.orbitControls,
        });
        this.scatterPlot.onCameraMove(this.cameraMoveCallback);
    }
    ScatterGL.prototype.setParameters = function (p) {
        if (p.onClick !== undefined)
            this.clickCallback = p.onClick;
        if (p.onHover !== undefined)
            this.hoverCallback = p.onHover;
        if (p.onSelect !== undefined)
            this.selectCallback = p.onSelect;
        if (p.onCameraMove !== undefined)
            this.cameraMoveCallback = p.onCameraMove;
        if (p.pointColorer !== undefined)
            this.pointColorer = p.pointColorer;
        if (p.renderMode !== undefined)
            this.renderMode = p.renderMode;
        if (p.rotateOnStart !== undefined)
            this.rotateOnStart = p.rotateOnStart;
        if (p.selectEnabled !== undefined)
            this.selectEnabled = p.selectEnabled;
        if (p.showLabelsOnHover !== undefined)
            this.showLabelsOnHover = p.showLabelsOnHover;
    };
    ScatterGL.prototype.render = function (dataset) {
        this.updateDataset(dataset);
        this.clearVisualizers();
        this.setVisualizers();
        if (this.rotateOnStart) {
            this.scatterPlot.startOrbitAnimation();
        }
    };
    ScatterGL.prototype.clearVisualizers = function () {
        this.canvasLabelsVisualizer = undefined;
        this.labels3DVisualizer = undefined;
        this.pointVisualizer = undefined;
        this.polylineVisualizer = undefined;
        this.spritesheetVisualizer = undefined;
        this.scatterPlot.disposeAllVisualizers();
    };
    ScatterGL.prototype.renderScatterPlot = function () {
        if (this.dataset)
            this.scatterPlot.render();
    };
    ScatterGL.prototype.setRenderMode = function (renderMode) {
        this.renderMode = renderMode;
        this.setVisualizers();
        this.updateScatterPlotAttributes();
        this.updateScatterPlotPositions();
    };
    ScatterGL.prototype.setTextRenderMode = function () {
        this.setRenderMode("TEXT");
        this.renderScatterPlot();
    };
    ScatterGL.prototype.setPointRenderMode = function () {
        this.setRenderMode("POINT");
        this.renderScatterPlot();
    };
    ScatterGL.prototype.setSpriteRenderMode = function () {
        if (this.dataset && this.dataset.spriteMetadata) {
            this.setRenderMode("SPRITE");
            this.renderScatterPlot();
        }
    };
    ScatterGL.prototype.setSequences = function (sequences) {
        this.sequences = sequences;
        this.updatePolylineAttributes();
        this.setVisualizers();
        this.renderScatterPlot();
    };
    ScatterGL.prototype.setPanMode = function () {
        this.scatterPlot.setInteractionMode("PAN");
    };
    ScatterGL.prototype.setSelectMode = function () {
        this.scatterPlot.setInteractionMode("SELECT");
    };
    ScatterGL.prototype.setDimensions = function (nDimensions) {
        var outsideRange = nDimensions < 2 || nDimensions > 3;
        var moreThanDataset = this.dataset && nDimensions > this.dataset.dimensions;
        if (outsideRange || moreThanDataset) {
            throw new RangeError('Setting invalid dimensionality');
        }
        else {
            this.scatterPlot.setDimensions(nDimensions);
            this.renderScatterPlot();
        }
    };
    ScatterGL.prototype.setPointColorer = function (pointColorer) {
        this.pointColorer = pointColorer;
        this.updateScatterPlotAttributes();
        this.renderScatterPlot();
    };
    ScatterGL.prototype.callPointColorer = function (pointColorer, index) {
        return pointColorer(index, this.selectedPointIndices, this.hoverPointIndex);
    };
    ScatterGL.prototype.setHoverPointIndex = function (index) {
        this.hoverPointIndex = index;
        this.updateScatterPlotAttributes();
        if (this.scatterPlot.orbitIsAnimating())
            return;
        this.renderScatterPlot();
    };
    ScatterGL.prototype.resize = function () {
        this.scatterPlot.resize();
    };
    ScatterGL.prototype.updateDataset = function (dataset) {
        this.setDataset(dataset);
        this.scatterPlot.setDimensions(dataset.dimensions);
        this.updateScatterPlotAttributes();
        this.updateScatterPlotPositions();
        this.renderScatterPlot();
    };
    ScatterGL.prototype.isOrbiting = function () {
        return this.scatterPlot.orbitIsAnimating();
    };
    ScatterGL.prototype.startOrbitAnimation = function () {
        this.scatterPlot.startOrbitAnimation();
    };
    ScatterGL.prototype.stopOrbitAnimation = function () {
        this.scatterPlot.stopOrbitAnimation();
    };
    ScatterGL.prototype.setDataset = function (dataset) {
        this.dataset = dataset;
        if (this.labels3DVisualizer) {
            this.labels3DVisualizer.setLabelStrings(this.generate3DLabelsArray());
        }
    };
    ScatterGL.prototype.updateScatterPlotPositions = function () {
        var dataset = this.dataset;
        if (!dataset)
            return;
        var newPositions = this.generatePointPositionArray(dataset);
        this.scatterPlot.setPointPositions(newPositions);
    };
    ScatterGL.prototype.updateScatterPlotAttributes = function () {
        var dataset = this.dataset;
        if (!dataset)
            return;
        var pointColors = this.generatePointColorArray(dataset);
        var pointScaleFactors = this.generatePointScaleFactorArray(dataset);
        var labels = this.generateVisibleLabelRenderParams();
        this.scatterPlot.setPointColors(pointColors);
        this.scatterPlot.setPointScaleFactors(pointScaleFactors);
        this.scatterPlot.setLabels(labels);
    };
    ScatterGL.prototype.updatePolylineAttributes = function () {
        var dataset = this.dataset;
        if (!dataset)
            return;
        var polylineColors = this.generateLineSegmentColorMap(dataset);
        var polylineOpacities = this.generateLineSegmentOpacityArray(dataset);
        var polylineWidths = this.generateLineSegmentWidthArray(dataset);
        this.scatterPlot.setPolylineColors(polylineColors);
        this.scatterPlot.setPolylineOpacities(polylineOpacities);
        this.scatterPlot.setPolylineWidths(polylineWidths);
    };
    ScatterGL.prototype.generatePointPositionArray = function (dataset) {
        var xExtent = [0, 0];
        var yExtent = [0, 0];
        var zExtent = [0, 0];
        xExtent = util.extent(dataset.points.map(function (p) { return p[0]; }));
        yExtent = util.extent(dataset.points.map(function (p) { return p[1]; }));
        if (dataset.dimensions === 3) {
            zExtent = util.extent(dataset.points.map(function (p) { return p[2]; }));
        }
        var getRange = function (extent) { return Math.abs(extent[1] - extent[0]); };
        var xRange = getRange(xExtent);
        var yRange = getRange(yExtent);
        var zRange = getRange(zExtent);
        var maxRange = Math.max(xRange, yRange, zRange);
        var halfCube = constants_1.SCATTER_PLOT_CUBE_LENGTH / 2;
        var makeScaleRange = function (range, base) { return [
            -base * (range / maxRange),
            base * (range / maxRange),
        ]; };
        var xScale = makeScaleRange(xRange, halfCube);
        var yScale = makeScaleRange(yRange, halfCube);
        var zScale = makeScaleRange(zRange, halfCube);
        var positions = new Float32Array(dataset.points.length * 3);
        var dst = 0;
        dataset.points.forEach(function (d, i) {
            var vector = dataset.points[i];
            positions[dst++] = util.scaleLinear(vector[0], xExtent, xScale);
            positions[dst++] = util.scaleLinear(vector[1], yExtent, yScale);
            if (dataset.dimensions === 3) {
                positions[dst++] = util.scaleLinear(vector[2], zExtent, zScale);
            }
            else {
                positions[dst++] = 0.0;
            }
        });
        return positions;
    };
    ScatterGL.prototype.generateVisibleLabelRenderParams = function () {
        var _a = this, hoverPointIndex = _a.hoverPointIndex, selectedPointIndices = _a.selectedPointIndices, styles = _a.styles;
        var n = hoverPointIndex !== null ? 1 : 0;
        var visibleLabels = new Uint32Array(n);
        var scale = new Float32Array(n);
        var opacityFlags = new Int8Array(n);
        var fillColors = new Uint8Array(n * 3);
        var strokeColors = new Uint8Array(n * 3);
        var labelStrings = [];
        scale.fill(styles.label.scaleDefault);
        opacityFlags.fill(1);
        var dst = 0;
        if (hoverPointIndex !== null) {
            labelStrings.push(this.getLabelText(hoverPointIndex));
            visibleLabels[dst] = hoverPointIndex;
            scale[dst] = styles.label.scaleLarge;
            opacityFlags[dst] = 0;
            var fillRgb = util.styleRgbFromHexColor(styles.label.fillColorHover);
            util.packRgbIntoUint8Array(fillColors, dst, fillRgb[0], fillRgb[1], fillRgb[2]);
            var strokeRgb = util.styleRgbFromHexColor(styles.label.strokeColorHover);
            util.packRgbIntoUint8Array(strokeColors, dst, strokeRgb[0], strokeRgb[1], strokeRgb[1]);
            ++dst;
        }
        {
            var fillRgb = util.styleRgbFromHexColor(styles.label.fillColorSelected);
            var strokeRgb = util.styleRgbFromHexColor(styles.label.strokeColorSelected);
            if (selectedPointIndices.size === 1) {
                var labelIndex = __spread(selectedPointIndices)[0];
                labelStrings.push(this.getLabelText(labelIndex));
                visibleLabels[dst] = labelIndex;
                scale[dst] = styles.label.scaleLarge;
                opacityFlags[dst] = 0;
                util.packRgbIntoUint8Array(fillColors, dst, fillRgb[0], fillRgb[1], fillRgb[2]);
                util.packRgbIntoUint8Array(strokeColors, dst, strokeRgb[0], strokeRgb[1], strokeRgb[2]);
            }
        }
        return new render_1.LabelRenderParams(new Float32Array(visibleLabels), labelStrings, scale, opacityFlags, styles.label.fontSize, fillColors, strokeColors);
    };
    ScatterGL.prototype.generatePointScaleFactorArray = function (dataset) {
        var e_1, _a;
        var _b = this, hoverPointIndex = _b.hoverPointIndex, selectedPointIndices = _b.selectedPointIndices, styles = _b.styles;
        var _c = styles.point, scaleDefault = _c.scaleDefault, scaleSelected = _c.scaleSelected, scaleHover = _c.scaleHover;
        var scale = new Float32Array(dataset.points.length);
        scale.fill(scaleDefault);
        var selectedPointCount = selectedPointIndices.size;
        {
            try {
                for (var _d = __values(selectedPointIndices.values()), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var p = _e.value;
                    scale[p] = scaleSelected;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        if (hoverPointIndex != null) {
            scale[hoverPointIndex] = scaleHover;
        }
        return scale;
    };
    ScatterGL.prototype.generatePointColorArray = function (dataset) {
        var e_2, _a;
        var _b = this, hoverPointIndex = _b.hoverPointIndex, pointColorer = _b.pointColorer, selectedPointIndices = _b.selectedPointIndices, styles = _b.styles;
        var _c = styles.point, colorHover = _c.colorHover, colorNoSelection = _c.colorNoSelection, colorSelected = _c.colorSelected, colorUnselected = _c.colorUnselected;
        var colors = new Float32Array(dataset.points.length * constants_1.RGBA_NUM_ELEMENTS);
        var unselectedColor = colorUnselected;
        var noSelectionColor = colorNoSelection;
        if (this.renderMode === "TEXT") {
            unselectedColor = this.styles.label3D.colorUnselected;
            noSelectionColor = this.styles.label3D.colorNoSelection;
        }
        if (this.renderMode === "SPRITE") {
            unselectedColor = this.styles.sprites.colorUnselected;
            noSelectionColor = this.styles.sprites.colorNoSelection;
        }
        var n = dataset.points.length;
        var selectedPointCount = this.selectedPointIndices.size;
        if (pointColorer) {
            var dst = 0;
            for (var i = 0; i < n; ++i) {
                var c = color_1.parseColor(this.callPointColorer(pointColorer, i) || noSelectionColor);
                colors[dst++] = c.r;
                colors[dst++] = c.g;
                colors[dst++] = c.b;
                colors[dst++] = c.opacity;
            }
        }
        else {
            var dst = 0;
            var c = selectedPointCount > 0
                ? color_1.parseColor(unselectedColor)
                : color_1.parseColor(noSelectionColor);
            for (var i = 0; i < n; ++i) {
                colors[dst++] = c.r;
                colors[dst++] = c.g;
                colors[dst++] = c.b;
                colors[dst++] = c.opacity;
            }
            c = color_1.parseColor(colorSelected);
            try {
                for (var _d = __values(selectedPointIndices.values()), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var selectedPointIndex = _e.value;
                    var dst_1 = selectedPointIndex * constants_1.RGBA_NUM_ELEMENTS;
                    colors[dst_1++] = c.r;
                    colors[dst_1++] = c.g;
                    colors[dst_1++] = c.b;
                    colors[dst_1++] = c.opacity;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                }
                finally { if (e_2) throw e_2.error; }
            }
            if (hoverPointIndex != null) {
                var c_1 = color_1.parseColor(colorHover);
                var dst_2 = hoverPointIndex * constants_1.RGBA_NUM_ELEMENTS;
                colors[dst_2++] = c_1.r;
                colors[dst_2++] = c_1.g;
                colors[dst_2++] = c_1.b;
                colors[dst_2++] = c_1.opacity;
            }
        }
        return colors;
    };
    ScatterGL.prototype.generate3DLabelsArray = function () {
        var dataset = this.dataset;
        if (!dataset)
            return [];
        var labels = [];
        var n = dataset.points.length;
        for (var i = 0; i < n; ++i) {
            labels.push(this.getLabelText(i));
        }
        return labels;
    };
    ScatterGL.prototype.generateLineSegmentColorMap = function (dataset) {
        var _a = this, pointColorer = _a.pointColorer, styles = _a.styles;
        var polylineColorArrayMap = {};
        for (var i = 0; i < this.sequences.length; i++) {
            var sequence = this.sequences[i];
            var colors = new Float32Array(2 * (sequence.indices.length - 1) * 3);
            var colorIndex = 0;
            if (pointColorer) {
                for (var j = 0; j < sequence.indices.length - 1; j++) {
                    var c1 = color_1.parseColor(this.callPointColorer(pointColorer, sequence.indices[j]));
                    var c2 = color_1.parseColor(this.callPointColorer(pointColorer, sequence.indices[j + 1]));
                    colors[colorIndex++] = c1.r;
                    colors[colorIndex++] = c1.g;
                    colors[colorIndex++] = c1.b;
                    colors[colorIndex++] = c2.r;
                    colors[colorIndex++] = c2.g;
                    colors[colorIndex++] = c2.b;
                }
            }
            else {
                for (var j = 0; j < sequence.indices.length - 1; j++) {
                    var c1 = util.getDefaultPointInPolylineColor(j, sequence.indices.length, styles.polyline.startHue, styles.polyline.endHue, styles.polyline.saturation, styles.polyline.lightness);
                    var c2 = util.getDefaultPointInPolylineColor(j + 1, sequence.indices.length, styles.polyline.startHue, styles.polyline.endHue, styles.polyline.saturation, styles.polyline.lightness);
                    colors[colorIndex++] = c1.r;
                    colors[colorIndex++] = c1.g;
                    colors[colorIndex++] = c1.b;
                    colors[colorIndex++] = c2.r;
                    colors[colorIndex++] = c2.g;
                    colors[colorIndex++] = c2.b;
                }
            }
            polylineColorArrayMap[i] = colors;
        }
        return polylineColorArrayMap;
    };
    ScatterGL.prototype.generateLineSegmentOpacityArray = function (dataset) {
        var _a = this, selectedPointIndices = _a.selectedPointIndices, styles = _a.styles;
        var opacities = new Float32Array(this.sequences.length);
        var selectedPointCount = selectedPointIndices.size;
        if (selectedPointCount > 0) {
            opacities.fill(styles.polyline.deselectedOpacity);
            var i = this.polylineVisualizer.getPointSequenceIndex(__spread(selectedPointIndices)[0]);
            if (i !== undefined)
                opacities[i] = styles.polyline.selectedOpacity;
        }
        else {
            opacities.fill(styles.polyline.defaultOpacity);
        }
        return opacities;
    };
    ScatterGL.prototype.generateLineSegmentWidthArray = function (dataset) {
        var _a = this, selectedPointIndices = _a.selectedPointIndices, styles = _a.styles;
        var widths = new Float32Array(this.sequences.length);
        widths.fill(styles.polyline.defaultLineWidth);
        var selectedPointCount = selectedPointIndices.size;
        if (selectedPointCount > 0) {
            var i = this.polylineVisualizer.getPointSequenceIndex(__spread(selectedPointIndices)[0]);
            if (i !== undefined)
                widths[i] = styles.polyline.selectedLineWidth;
        }
        return widths;
    };
    ScatterGL.prototype.getLabelText = function (i) {
        var dataset = this.dataset;
        if (!dataset)
            return '';
        var metadata = dataset.metadata[i];
        return metadata && metadata.label != null ? "" + metadata.label : '';
    };
    ScatterGL.prototype.initializeCanvasLabelsVisualizer = function () {
        if (!this.canvasLabelsVisualizer) {
            this.canvasLabelsVisualizer = new scatter_plot_visualizer_canvas_labels_1.ScatterPlotVisualizerCanvasLabels(this.containerElement, this.styles);
        }
        return this.canvasLabelsVisualizer;
    };
    ScatterGL.prototype.initialize3DLabelsVisualizer = function () {
        if (!this.labels3DVisualizer) {
            this.labels3DVisualizer = new scatter_plot_visualizer_3d_labels_1.ScatterPlotVisualizer3DLabels(this.styles);
        }
        this.labels3DVisualizer.setLabelStrings(this.generate3DLabelsArray());
        return this.labels3DVisualizer;
    };
    ScatterGL.prototype.initializePointVisualizer = function () {
        if (!this.pointVisualizer) {
            this.pointVisualizer = new scatter_plot_visualizer_sprites_1.ScatterPlotVisualizerSprites(this.styles);
        }
        return this.pointVisualizer;
    };
    ScatterGL.prototype.initializeSpritesheetVisualizer = function () {
        var _this = this;
        var styles = this.styles;
        var dataset = this.dataset;
        var spriteMetadata = dataset.spriteMetadata;
        if (!this.spritesheetVisualizer && spriteMetadata) {
            if (!spriteMetadata.spriteImage || !spriteMetadata.singleSpriteSize) {
                return;
            }
            var n = dataset.points.length;
            var spriteIndices = void 0;
            if (spriteMetadata.spriteIndices) {
                spriteIndices = new Float32Array(spriteMetadata.spriteIndices);
            }
            else {
                spriteIndices = new Float32Array(n);
                for (var i = 0; i < n; ++i) {
                    spriteIndices[i] = i;
                }
            }
            var onImageLoad = function () { return _this.renderScatterPlot(); };
            var spritesheetVisualizer = new scatter_plot_visualizer_sprites_1.ScatterPlotVisualizerSprites(styles, {
                spritesheetImage: spriteMetadata.spriteImage,
                spriteDimensions: spriteMetadata.singleSpriteSize,
                spriteIndices: spriteIndices,
                onImageLoad: onImageLoad,
            });
            spritesheetVisualizer.id = 'SPRITE_SHEET_VISUALIZER';
            this.spritesheetVisualizer = spritesheetVisualizer;
        }
        return this.spritesheetVisualizer;
    };
    ScatterGL.prototype.initializePolylineVisualizer = function () {
        if (!this.polylineVisualizer) {
            this.polylineVisualizer = new scatter_plot_visualizer_polylines_1.ScatterPlotVisualizerPolylines();
        }
        this.polylineVisualizer.setSequences(this.sequences);
        return this.polylineVisualizer;
    };
    ScatterGL.prototype.setVisualizers = function () {
        var _a = this, dataset = _a.dataset, renderMode = _a.renderMode;
        var activeVisualizers = [];
        if (renderMode === "TEXT") {
            var visualizer = this.initialize3DLabelsVisualizer();
            activeVisualizers.push(visualizer);
        }
        else if (renderMode === "POINT") {
            var visualizer = this.initializePointVisualizer();
            activeVisualizers.push(visualizer);
        }
        else if (renderMode === "SPRITE" && dataset.spriteMetadata) {
            var visualizer = this.initializeSpritesheetVisualizer();
            if (visualizer)
                activeVisualizers.push(visualizer);
        }
        if (this.sequences.length > 0) {
            var visualizer = this.initializePolylineVisualizer();
            activeVisualizers.push(visualizer);
        }
        var textLabelsRenderMode = renderMode === "POINT" || renderMode === "SPRITE";
        if (textLabelsRenderMode && this.showLabelsOnHover) {
            var visualizer = this.initializeCanvasLabelsVisualizer();
            activeVisualizers.push(visualizer);
        }
        this.scatterPlot.setActiveVisualizers(activeVisualizers);
    };
    ScatterGL.Dataset = data_1.Dataset;
    return ScatterGL;
}());
exports.ScatterGL = ScatterGL;