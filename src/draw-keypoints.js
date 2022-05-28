import * as posedetection from '@tensorflow-models/pose-detection'
import { config } from './00_config.js'

import { isset } from 'topkat-utils'

export function drawKeypoint(ctx, keypoint, color) {
    // If score is null, just show the keypoint.
    ctx.fillStyle = color
    ctx.strokeStyle = color
    const score = isset(keypoint.score) ? keypoint.score : 1;
    const scoreThreshold = config.pointConfidenceScoreMin || 0;

    if (score >= scoreThreshold) {
        const circle = new Path2D();
        circle.arc(keypoint.x - config.offset.x, keypoint.y - config.offset.y, config.radius, 0, 2 * Math.PI);
        ctx.fill(circle);
        ctx.stroke(circle);
    }
}

export function drawSkeleton(keypoints, ctx) {
    ctx.fillStyle = 'White'
    ctx.strokeStyle = 'White'
    ctx.lineWidth = config.lineWidth

    posedetection.util.getAdjacentPairs(config.model).forEach(([
        i, j
    ]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        // If score is null, just show the keypoint.
        const score1 = kp1.score != null ? kp1.score : 1;
        const score2 = kp2.score != null ? kp2.score : 1;
        const scoreThreshold = config.pointConfidenceScoreMin || 0;

        if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
            ctx.beginPath();
            ctx.moveTo(kp1.x - config.offset.x, kp1.y - config.offset.y);
            ctx.lineTo(kp2.x - config.offset.x, kp2.y - config.offset.y);
            ctx.stroke();
        }
    });
}