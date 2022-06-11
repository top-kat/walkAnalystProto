
import { config } from './00_config.js'


/**
 * @returns 1 => very different ; 0 => exacltly similar
 */
export function getPixelsDifference(color1, color2) {
    const [r1, g1, b1] = color1
    const [h1, s1, l1] = rgbToHsl(r1, g1, b1)
    const [r2, g2, b2] = color2 // getPixelAtCoord(ctx, x2, y2)
    const [h2, s2, l2] = rgbToHsl(r2, g2, b2)

    const similarity = ((
        Math.abs(h1 - h2) * config.hueInfluence +
        Math.abs(s1 - s2) * config.saturationInfluence +
        Math.abs(l1 - l2) * config.luminosityInfluence
    ) / (
            config.hueInfluence +
            config.saturationInfluence +
            config.luminosityInfluence
        ))
    // const similarity = Math.max(Math.abs(h1 - h2), Math.abs(s1 - s2), Math.abs(l1 - l2))

    // maxDif = Math.max(maxDif, similarity)
    // minDiff = Math.min(minDiff, similarity)
    return similarity
}


export function setPixelForCoord(ctx, x, y, pixel) {
    const offset = config.offset
    const [r, g, b, a = 1] = pixel;
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctx.fillRect(x - offset.x, y - offset.y, 1, 1);
}

export function getPixelAtCoord(ctx, x, y) {
    const offset = config.offset
    return ctx.getImageData(x - offset.x, y - offset.y, 1, 1).data
}

export function forEachPixOfSquare(ctx, callback, xStart = config.offset.x, yStart = config.offset.y, xEnd = config.offset.x + config.offset.w, yEnd = config.offset.y + config.offset.h) {
    for (let Y = yStart; Y <= yEnd; Y++) {
        for (let X = xStart; X <= xEnd; X++) {
            callback(X, Y, getPixelAtCoord(ctx, X, Y, config.offset))
        }
    }
}

export function hslToRgb(h, s, l = 0.5) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @param   inputBitNb default: 255, 8 for 8 bit colors
 * @return  Array           The HSL representation
 */
export function rgbToHsl(r, g, b) {
    const inputBitNb = 255
    r /= inputBitNb, g /= inputBitNb, b /= inputBitNb;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) h = s = 0; // achromatic
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return [h, s, l];
}


export function distance(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
}

export function isBlack([r, g, b]) {
    return r === 0 && g === 0 && b === 0
}