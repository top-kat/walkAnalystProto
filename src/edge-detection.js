

import jsfeat from 'jsfeat'
import { config } from './00_config.js'


export function edgeDetector(ctx) {

    const img_u8 = new jsfeat.matrix_t(config.offset.w, config.offset.h, jsfeat.U8C1_t);

    const imageData = ctx.getImageData(0, 0, config.offset.w, config.offset.h)
    const originalImgData = ctx.getImageData(0, 0, config.offset.w, config.offset.h)

    const imgDataCache = [...imageData.data]

    jsfeat.imgproc.grayscale(imageData.data, config.offset.w, config.offset.h, img_u8);

    let r = config.blur_radius | 0;
    if (r !== 0) {
        var kernel_size = (r + 1) << 1;
        jsfeat.imgproc.gaussian_blur(img_u8, img_u8, kernel_size, 0);
    }

    jsfeat.imgproc.canny(img_u8, img_u8, config.low_threshold | 0, config.high_threshold | 0);

    // render result back to canvas
    const data_u32 = new Uint32Array(imageData.data.buffer);
    const alpha = (0xff << 24);
    let i = img_u8.cols * img_u8.rows, pix = 0;
    while (--i >= 0) {
        pix = img_u8.data[i];
        data_u32[i] = alpha | (pix << 16) | (pix << 8) | pix;
    }

    for (let i = 0; i < imageData.data.length; i += 4) {
        const [r, g, b, a] = [
            imageData.data[i],
            imageData.data[i] + 1,
            imageData.data[i] + 2,
            imageData.data[i] + 3,
        ]
        const isEdge = r + g + b > 50

        originalImgData.data[i] = isEdge ? 0 : imgDataCache[i]
        originalImgData.data[i + 1] = isEdge ? 0 : imgDataCache[i + 1]
        originalImgData.data[i + 2] = isEdge ? 0 : imgDataCache[i + 2]
        originalImgData.data[i + 3] = isEdge ? 255 : imgDataCache[i + 3]
    }

    ctx.putImageData(originalImgData, 0, 0)
}