
import * as posedetection from '@tensorflow-models/pose-detection';
import * as scatter from './libs/scatter-gl/index.js';
import { STATE, DEFAULT_LINE_WIDTH, DEFAULT_RADIUS } from './params';

const ANCHOR_POINTS = [];




export function drawResult(pose, ctx, video) {
    const { keypoints, keypoints3D } = pose
    if (keypoints != null) {

        const frameBorderOffset = 50
        const ignorePointsIndex = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22] // hands
        let xMin = 9999
        let yMin = 9999
        let xMax = 0
        let yMax = 0

        for (const [i, keyPoint] of Object.entries(keypoints)) {
            if (!ignorePointsIndex.includes(i)) {
                const { x, y /*, z, name, score*/ } = keyPoint
                xMin = Math.min(x, xMin)
                yMin = Math.min(y, yMin)
                xMax = Math.max(x, xMax)
                yMax = Math.max(y, yMax)
            }
        }
        const offset = {
            x: xMin - frameBorderOffset,
            y: yMin - frameBorderOffset,
            w: xMax - xMin + frameBorderOffset * 2,
            h: yMax - yMin + frameBorderOffset * 2,
        }

        ctx.clearRect(0, 0, video.videoWidth, video.videoHeight)

        ctx.drawImage(video, offset.x, offset.y, offset.w, offset.h, 0, 0, offset.w, offset)


        drawKeypoints(keypoints, offset, ctx);
        drawSkeleton(keypoints, offset, ctx);
        drawKeypoints3D(keypoints3D);
    }
}


function drawKeypoints(keypoints, offset, ctx) {


    const [
        nose, // 0
        eyeRightInner, // 1 
        eyeRight,
        eyeRightOuter,
        eyeLeftInner,
        eyeLeft,
        eyeLeftOuter,
        earRight,
        earLeft,
        mouthRight,
        mouthLeft,
        shoulderRight,
        shoulderLeft,
        elbowRight, // 13
        elbowLeft, // 14
        wristRight, // 15
        wristLeft, // 16
        pinkyKnuckleRight, // 17
        pinkyKnuckleLeft, // 18
        indexKnuckleRight, // 19
        indexKnuckleLeft, // 20
        thumbKnuckleRight, // 21
        thumbKnuckleLeft, // 22
        hipRight, // hanche
        hipLeft,
        kneeRight,
        kneeLeft,
        ankleRight, // cheville
        ankleLeft,
        heelRight, // talon
        heelLeft,
        footIndexRight, // pointe de pied
        footIndexLeft,
    ] = keypoints


    const keypointInd = posedetection.util.getKeypointIndexBySide(STATE.model);
    ctx.fillStyle = 'Red';
    ctx.strokeStyle = 'Red';
    ctx.lineWidth = DEFAULT_LINE_WIDTH;

    for (const i of keypointInd.middle) {
        drawKeypoint(keypoints[i], offset, ctx);
    }

    ctx.fillStyle = 'Green';
    ctx.strokeStyle = 'Green';
    for (const i of keypointInd.left) {
        drawKeypoint(keypoints[i], offset, ctx);
    }

    ctx.fillStyle = 'Orange';
    ctx.strokeStyle = 'Orange';
    for (const i of keypointInd.right) {
        drawKeypoint(keypoints[i], offset, ctx);
    }
}

function drawKeypoint(keypoint, offset, ctx) {
    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = STATE.modelConfig.scoreThreshold || 0;

    if (score >= scoreThreshold) {
        const circle = new Path2D();
        circle.arc(keypoint.x - offset.x, keypoint.y - offset.y, DEFAULT_RADIUS, 0, 2 * Math.PI);
        ctx.fill(circle);
        ctx.stroke(circle);
    }
}

const scatterGLEl = document.querySelector('#scatter-gl-container');
const scatterGL = new scatter.ScatterGL(scatterGLEl, {
    'rotateOnStart': true,
    'selectEnabled': false,
    'styles': { polyline: { defaultOpacity: 1, deselectedOpacity: 1 } },
});
scatterGLEl.style = `height: 330px;`;
scatterGL.resize()
let scatterGLHasInitialized = false;

function drawKeypoints3D(keypoints) {
    const scoreThreshold = 0;
    const pointsData = keypoints.map((keypoint) => ([-keypoint.x, -keypoint.y, -keypoint.z]));

    const dataset = new scatter.ScatterGL.Dataset([...pointsData, ...ANCHOR_POINTS]);

    const keypointInd = posedetection.util.getKeypointIndexBySide(STATE.model);
    scatterGL.setPointColorer((i) => {
        if (keypoints[i] == null || keypoints[i].score < scoreThreshold) {
            // hide anchor points and low-confident points.
            return '#0000ff';
        }
        if (i === 0) {
            return '#ff0000';
        }
        if (keypointInd.left.indexOf(i) > -1) {
            return '#00ff00';
        }
        if (keypointInd.right.indexOf(i) > -1) {
            return '#ffa500';
        }
    });

    if (!scatterGLHasInitialized) {
        scatterGL.render(dataset);
    } else {
        scatterGL.updateDataset(dataset);
    }
    const connections = posedetection.util.getAdjacentPairs(STATE.model);
    const sequences = connections.map((pair) => ({ indices: pair }));
    scatterGL.setSequences(sequences);
    scatterGLHasInitialized = true;
}

/**
 * Draw the skeleton of a body on the video.
 * @param keypoints A list of keypoints.
 */
function drawSkeleton(keypoints, offset, ctx) {
    ctx.fillStyle = 'White';
    ctx.strokeStyle = 'White';
    ctx.lineWidth = DEFAULT_LINE_WIDTH;

    posedetection.util.getAdjacentPairs(STATE.model).forEach(([
        i, j
    ]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        // If score is null, just show the keypoint.
        const score1 = kp1.score != null ? kp1.score : 1;
        const score2 = kp2.score != null ? kp2.score : 1;
        const scoreThreshold = STATE.modelConfig.scoreThreshold || 0;

        if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
            ctx.beginPath();
            ctx.moveTo(kp1.x - offset.x, kp1.y - offset.y);
            ctx.lineTo(kp2.x - offset.x, kp2.y - offset.y);
            ctx.stroke();
        }
    });
}