"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = require("three");
function vector3DToScreenCoords(cam, w, h, v) {
    var dpr = window.devicePixelRatio;
    var pv = new THREE.Vector3().copy(v).project(cam);
    var coords = [
        ((pv.x + 1) / 2) * w * dpr,
        -(((pv.y - 1) / 2) * h) * dpr,
    ];
    return coords;
}
exports.vector3DToScreenCoords = vector3DToScreenCoords;
function vector3FromPackedArray(a, pointIndex) {
    var offset = pointIndex * 3;
    return new THREE.Vector3(a[offset], a[offset + 1], a[offset + 2]);
}
exports.vector3FromPackedArray = vector3FromPackedArray;
function getNearFarPoints(worldSpacePoints, cameraPos, cameraTarget) {
    var shortestDist = Infinity;
    var furthestDist = 0;
    var camToTarget = new THREE.Vector3().copy(cameraTarget).sub(cameraPos);
    var camPlaneNormal = new THREE.Vector3().copy(camToTarget).normalize();
    var n = worldSpacePoints.length / 3;
    var src = 0;
    var p = new THREE.Vector3();
    var camToPoint = new THREE.Vector3();
    for (var i = 0; i < n; i++) {
        p.x = worldSpacePoints[src];
        p.y = worldSpacePoints[src + 1];
        p.z = worldSpacePoints[src + 2];
        src += 3;
        camToPoint.copy(p).sub(cameraPos);
        var dist = camPlaneNormal.dot(camToPoint);
        if (dist < 0) {
            continue;
        }
        furthestDist = dist > furthestDist ? dist : furthestDist;
        shortestDist = dist < shortestDist ? dist : shortestDist;
    }
    return [shortestDist, furthestDist];
}
exports.getNearFarPoints = getNearFarPoints;
function prepareTexture(texture, needsUpdate) {
    if (needsUpdate === void 0) { needsUpdate = true; }
    texture.needsUpdate = needsUpdate;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.flipY = false;
    return texture;
}
function createTextureFromCanvas(image) {
    var texture = new THREE.Texture(image);
    return prepareTexture(texture);
}
exports.createTextureFromCanvas = createTextureFromCanvas;
function createTextureFromImage(image, onImageLoad) {
    var texture = new THREE.Texture(image);
    if (image.complete) {
        texture.needsUpdate = true;
        onImageLoad();
    }
    else {
        image.onload = function () {
            texture.needsUpdate = true;
            onImageLoad();
        };
    }
    return prepareTexture(texture, false);
}
exports.createTextureFromImage = createTextureFromImage;
function hasWebGLSupport() {
    try {
        var c = document.createElement('canvas');
        var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
        return gl != null;
    }
    catch (e) {
        return false;
    }
}
exports.hasWebGLSupport = hasWebGLSupport;
function extent(data) {
    var minimum = Infinity;
    var maximum = -Infinity;
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        if (item < minimum)
            minimum = item;
        if (item > maximum)
            maximum = item;
    }
    return [minimum, maximum];
}
exports.extent = extent;
function scaleLinear(value, domain, range) {
    var domainDifference = domain[1] - domain[0];
    var rangeDifference = range[1] - range[0];
    var percentDomain = (value - domain[0]) / domainDifference;
    return percentDomain * rangeDifference + range[0];
}
exports.scaleLinear = scaleLinear;
function scaleExponential(value, domain, range) {
    var domainDifference = Math.pow(domain[1], Math.E) - Math.pow(domain[0], Math.E);
    var rangeDifference = range[1] - range[0];
    var percentDomain = (Math.pow(value, Math.E) - domain[0]) / domainDifference;
    return percentDomain * rangeDifference + range[0];
}
exports.scaleExponential = scaleExponential;
function packRgbIntoUint8Array(rgbArray, labelIndex, r, g, b) {
    rgbArray[labelIndex * 3] = r;
    rgbArray[labelIndex * 3 + 1] = g;
    rgbArray[labelIndex * 3 + 2] = b;
}
exports.packRgbIntoUint8Array = packRgbIntoUint8Array;
function styleRgbFromHexColor(hex) {
    var c = new THREE.Color(hex);
    return [(c.r * 255) | 0, (c.g * 255) | 0, (c.b * 255) | 0];
}
exports.styleRgbFromHexColor = styleRgbFromHexColor;
var toPercent = function (percent) { return 100 * percent + "%"; };
function getDefaultPointInPolylineColor(index, totalPoints, startHue, endHue, saturation, lightness) {
    var hue = startHue + ((endHue - startHue) * index) / totalPoints;
    var hsl = "hsl(" + hue + ", " + toPercent(saturation) + ", " + toPercent(lightness) + ")";
    return new THREE.Color(hsl);
}
exports.getDefaultPointInPolylineColor = getDefaultPointInPolylineColor;
