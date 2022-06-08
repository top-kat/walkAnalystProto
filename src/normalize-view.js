



export function normalizeView() {

}







// helper functions create canvas and get context
const CImage = (w = 128, h = w) => (c = document.createElement("canvas"), c.width = w, c.height = h, c);
const CImageCtx = (w = 128, h = w) => (c = CImage(w, h), c.ctx = c.getContext("2d"), c);
// iterators
const doFor = (count, cb) => { var i = 0; while (i < count && cb(i++) !== true); };
const eachOf = (array, cb) => { var i = 0; const len = array.length; while (i < len && cb(array[i], i++, len) !== true); };

const upScale = 0.5;
var canvas1 = CImageCtx(64, 8);
var canvas2 = CImageCtx(canvas1.width * upScale, canvas1.height * upScale);
var canvas3 = CImageCtx(canvas1.width * upScale, canvas1.height * upScale);


// imgDat is a imageData object, 
// x,y are floats in the original coordinates
// Returns the pixel colour at that point as an array of RGBA
// Will copy last pixel's colour
function getPixelValue(imgDat, x, y, result = []) {
    var i;
    // clamp and floor coordinate
    const ix1 = (x < 0 ? 0 : x >= imgDat.width ? imgDat.width - 1 : x) | 0;
    const iy1 = (y < 0 ? 0 : y >= imgDat.height ? imgDat.height - 1 : y) | 0;
    // get next pixel pos
    const ix2 = ix1 === imgDat.width - 1 ? ix1 : ix1 + 1;
    const iy2 = iy1 === imgDat.height - 1 ? iy1 : iy1 + 1;
    // get interpolation position 
    const xpos = x % 1;
    const ypos = y % 1;
    // get pixel index
    var i1 = (ix1 + iy1 * imgData.width) * 4;
    var i2 = (ix2 + iy1 * imgData.width) * 4;
    var i3 = (ix1 + iy2 * imgData.width) * 4;
    var i4 = (ix2 + iy2 * imgData.width) * 4;

    // to keep code short and readable get data alias
    const d = imgDat.data;

    // interpolate x for top and bottom pixels
    for (i = 0; i < 3; i++) {
        const c1 = (d[i2] * d[i2++] - d[i1] * d[i1]) * xpos + d[i1] * d[i1++];
        const c2 = (d[i4] * d[i4++] - d[i3] * d[i3]) * xpos + d[i3] * d[i3++];

        // now interpolate y
        result[i] = Math.sqrt((c2 - c1) * ypos + c1);
    }

    // and alpha is not logarithmic
    const c1 = (d[i2] - d[i1]) * xpos + d[i1];
    const c2 = (d[i4] - d[i3]) * xpos + d[i3];
    result[3] = (c2 - c1) * ypos + c1;
    return result;
}
const ctx = canvas1.ctx;
var cols = ["black", "red", "green", "Blue", "Yellow", "Cyan", "Magenta", "White"];
doFor(8, j => eachOf(cols, (col, i) => { ctx.fillStyle = col; ctx.fillRect(j * 8 + i, 0, 1, 8) }));
eachOf(cols, (col, i) => { ctx.fillStyle = col; ctx.fillRect(i * 8, 4, 8, 4) });

const imgData = ctx.getImageData(0, 0, canvas1.width, canvas1.height);
const imgData2 = ctx.createImageData(canvas1.width * upScale, canvas1.height * upScale);
const res = new Uint8ClampedArray(4);
for (var y = 0; y < imgData2.height; y++) {
    for (var x = 0; x < imgData2.width; x++) {
        getPixelValue(imgData, x / upScale, y / upScale, res);
        imgData2.data.set(res, (x + y * imgData2.width) * 4);
    }
}
canvas2.ctx.putImageData(imgData2, 0, 0);
function $(el, text) { const e = document.createElement(el); e.textContent = text; document.body.appendChild(e) };

document.body.appendChild(canvas1);
$("div", "Next Logarithmic upscale using linear interpolation * 8");
document.body.appendChild(canvas2);
canvas3.ctx.drawImage(canvas1, 0, 0, canvas3.width, canvas3.height);
document.body.appendChild(canvas3);
$("div", "Previous Canvas 2D API upscale via default linear interpolation * 8");
$("div", "Note the overall darker result and dark lines at hue boundaries");