
import * as posedetection from '@tensorflow-models/pose-detection';
import * as scatter from './libs/scatter-gl/index.js';
import { STATE, DEFAULT_LINE_WIDTH, DEFAULT_RADIUS } from './params';
import $ from 'jquery'
import { rgbToHsl, getPixelAtCoord, setPixelForCoord } from './draw-utils'

import { moyenne, isset } from 'topkat-utils'

const ANCHOR_POINTS = [];

let scatterGLHasInitialized = false;

const similarColorTreshold = 0.5
const maxShoeDetectionArea = 2500


let offset = { x: 0, y: 0, w: 0, h: 0 }

let maxDif = 0
let minDiff = 999

const scatterGLEl = document.querySelector('#scatter-gl-container');
const scatterGL = new scatter.ScatterGL(scatterGLEl, {
    'rotateOnStart': true,
    'selectEnabled': false,
    'styles': { polyline: { defaultOpacity: 1, deselectedOpacity: 1 } },
});
scatterGLEl.style = `height: 576px;width:50vw;`;
scatterGL.resize()

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
        offset = {
            x: xMin - frameBorderOffset,
            y: yMin - frameBorderOffset,
            w: xMax - xMin + frameBorderOffset * 2,
            h: yMax - yMin + frameBorderOffset * 2,
        }

        ctx.clearRect(0, 0, video.videoWidth, video.videoHeight)

        ctx.drawImage(video, offset.x, offset.y, offset.w, offset.h, 0, 0, offset.w, offset.h)


        drawKeypoints(keypoints, ctx);
        drawSkeleton(keypoints, ctx);
        drawKeypoints3D(keypoints3D);
    }
}


function drawKeypoints(keypoints, ctx) {


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

    const st = {}


    const walkDirection = st.walkDirection = footIndexRight.x > heelRight.x ? 'leftToRight' : 'rightToLeft'

    const moyRightFoot = { x: moyenne([footIndexRight.x, heelRight.x, ankleRight.x]), y: moyenne([footIndexRight.y, heelRight.y, ankleRight.y]) }
    const moyLeftFoot = { x: moyenne([footIndexLeft.x, heelLeft.x, ankleLeft.x]), y: moyenne([footIndexLeft.y, heelLeft.y, ankleLeft.y]) }

    const rightFootPosition = st.rightFootPosition = moyRightFoot.x > moyLeftFoot.x ? 'right' : 'left'
    const frontFoot = st.frontFoot = rightFootPosition === 'right' ? (walkDirection === 'leftToRight' ? 'right' : 'left') : (walkDirection === 'leftToRight' ? 'left' : 'right')

    const talonChevilleDistMoy = moyenne([
        Math.abs(distance(kneeRight.x, kneeRight.y, ankleRight.x, ankleRight.y)),
        Math.abs(distance(kneeLeft.x, kneeLeft.y, ankleLeft.x, ankleLeft.y))
    ])

    const shoeRightPixObject = findShoeColorZone(ctx, st, moyRightFoot.x, moyRightFoot.y, talonChevilleDistMoy / 2, ankleRight.y - talonChevilleDistMoy * 0.15)
    //const shoeLeftPixObject = findShoeColorZone(ctx, st, moyLeftFoot.x, moyLeftFoot.y, talonChevilleDistMoy * 2, ankleLeft.y - talonChevilleDistMoy * 0.3)

    for (const [pixObject] of [[shoeRightPixObject.data, [255, 128, 0]]/*, [shoeLeftPixObject.data, [0, 128, 255]]*/]) {
        for (const [x, y, diff] of pixObject) {
            const a = diff === 0 ? 0 : diff - minDiff
            const b = maxDif - minDiff
            const normalizedColorDiff = (1 / b) * a
            const color = [Math.round((1 - diff) * 255), 0, Math.round(diff * 255), 1]
            if (diff < 0.5) setPixelForCoord(ctx, x, y, color, offset)
        }
    }


    const keypointInd = posedetection.util.getKeypointIndexBySide(STATE.model);

    ctx.lineWidth = DEFAULT_LINE_WIDTH;

    drawKeypoint(ctx, moyRightFoot, 'Red')
    drawKeypoint(ctx, moyLeftFoot, 'Red')

    for (const i of keypointInd.middle) drawKeypoint(ctx, keypoints[i], 'Red')
    for (const i of keypointInd.left) drawKeypoint(ctx, keypoints[i], 'Green')
    for (const i of keypointInd.right) drawKeypoint(ctx, keypoints[i], 'Orange')


    $('#dataTable').remove()
    $('#dataWrapper').append(`<table id='dataTable'>${Object.entries(st).map(([name, val]) => `<tr><td>${name}</td><td>${val}</td></tr>`).join('')}</table>`)
}

function drawKeypoint(ctx, keypoint, color) {
    // If score is null, just show the keypoint.
    ctx.fillStyle = color
    ctx.strokeStyle = color
    const score = isset(keypoint.score) ? keypoint.score : 1;
    const scoreThreshold = STATE.modelConfig.scoreThreshold || 0;

    if (score >= scoreThreshold) {
        const circle = new Path2D();
        circle.arc(keypoint.x - offset.x, keypoint.y - offset.y, DEFAULT_RADIUS, 0, 2 * Math.PI);
        ctx.fill(circle);
        ctx.stroke(circle);
    }
}

function drawKeypoints3D(keypoints) {
    const scoreThreshold = 0;
    const pointsData = keypoints.map((keypoint) => ([-keypoint.x, -keypoint.y, -keypoint.z]));

    const dataset = new scatter.ScatterGL.Dataset([...pointsData, ...ANCHOR_POINTS]);

    const keypointInd = posedetection.util.getKeypointIndexBySide(STATE.model);
    scatterGL.setPointColorer((i) => {
        if (keypoints[i] == null || keypoints[i].score < scoreThreshold) return '#0000ff';
        if (i === 0) return '#ff0000'
        if (keypointInd.left.indexOf(i) > -1) return '#00ff00'
        if (keypointInd.right.indexOf(i) > -1) return '#ffa500'
    });

    if (!scatterGLHasInitialized) scatterGL.render(dataset)
    else scatterGL.updateDataset(dataset)

    const connections = posedetection.util.getAdjacentPairs(STATE.model);
    const sequences = connections.map((pair) => ({ indices: pair }));
    scatterGL.setSequences(sequences);
    scatterGLHasInitialized = true;
}

function drawSkeleton(keypoints, ctx) {
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


const shoeDetection = {
    maxDifferenceBetween2groundPixels: 0.05,
    maxDiffTresholdForDifferentColors: 0.28,
}
function findShoeColorZone(ctx, st, x, y, size, maxShoeX) {

    const minX = Math.round(x - size)
    const minY = Math.round(y - size)
    const maxX = Math.round(x + size)
    const maxY = Math.round(y + size)
    const confidenceScore = { floorDetection: 0 }

    const forEachPixOfSquare = (callback, xStart = minX, yStart = minY) => {
        for (let Y = yStart; Y <= maxY; Y++) {
            for (let X = xStart; X <= maxX; X++) {
                callback(X, Y, getPixelAtCoord(ctx, X, Y, offset))
            }
        }
    }

    // SHOE COLOR
    const shoeAvgPix = [[x, y], ...getAdjacentPixels(x, y)].map(pix => getPixelAtCoord(ctx, pix[0], pix[1], offset))
    const shoeColor = [moyenne(shoeAvgPix.map(c => c[0])), moyenne(shoeAvgPix.map(c => c[1])), moyenne(shoeAvgPix.map(c => c[2]))]

    // MARK DIFFERENTS PIXELS ON IMAGE
    const differentPixels = {}
    forEachPixOfSquare((X, Y, color) => {
        if (getPixelsDifference(color, shoeColor) > shoeDetection.maxDiffTresholdForDifferentColors) {
            differentPixels[`${X}-${Y}`] = [X, Y]
        }
    })

    // FIND GROUND COLOR by analysing the base pixel line
    const groundColors = [] // :[[r,g,b], nbOccurence, diffWithShoeColor]
    forEachPixOfSquare((X, Y, color) => {
        let similarColorObj = groundColors.find(colorObj => getPixelsDifference(color, colorObj[0]) < shoeDetection.maxDifferenceBetween2groundPixels)
        if (!similarColorObj) {
            similarColorObj = [color, 1, getPixelsDifference(shoeColor, color)]
            groundColors.push(similarColorObj)
        } else similarColorObj[1]++
    }, undefined, maxY)

    st.groundColors = groundColors.map(([clr]) => `<span class='colorSwatch' style='background-color:rgb(${clr.join(',')})'></span>`).join('')

    // MARK GROUND PIXELS
    const groundPixels = {} // { 'X-Y': [x, y]}
    const colorDifferencesWithShoe = []
    for (const [groundColor, nbOccurence, diffWithShoeColor] of groundColors) {
        if (nbOccurence > size * 0.05) {
            colorDifferencesWithShoe.push(diffWithShoeColor)
            const maxDiffForGroundPixels = diffWithShoeColor / 2
            forEachPixOfSquare((X, Y, color) => {
                if (!isset(differentPixels[`${X}-${Y}`]) && getPixelsDifference(groundColor, color) <= maxDiffForGroundPixels) {
                    groundPixels[`${X}-${Y}`] = [X, Y]
                }
            })
        }
    }
    confidenceScore.floorDetection = st.floorDetectionConfidence = Math.min(1, (1 / 0.3) * moyenne(colorDifferencesWithShoe))

    // SHOE PIX CLUSTER
    const shoePixCluster = getColorZoneAroundPoint(ctx, x, y, shoeColor, Object.keys({ ...differentPixels, ...groundPixels }))

    // TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO
    // * enlever tout les pixels aux extrémités * 2
    // * prendre le milieu et trouver les pixels adjacents
    // * remplir les trous
    // * 
    // TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO

    drawPixelCluster(ctx, Object.values(groundPixels), [0, 255, 0, 0.5])
    drawPixelCluster(ctx, Object.values(differentPixels), [255, 0, 0, 0.5])
    drawPixelCluster(ctx, shoePixCluster.data, [0, 0, 255, 0.5])

    return { data: [], minX: 0, maxX: 0, minY: 0, maxY: 0 }
}

function drawPixelCluster(ctx, pixels, color) {
    for (const [x, y] of pixels) setPixelForCoord(ctx, x, y, color, offset)
}

function getColorZoneAroundPoint(ctx, x, y, baseColor, ignorePixs = []) {
    const pixObj = {}
    const notProcessed = [[x, y]]
    pixObj[x + '-' + y] = [x, y, 0]
    while (notProcessed.length && Object.keys(pixObj).length < maxShoeDetectionArea) {
        let [actualX, actualY] = notProcessed.shift().map(i => Math.round(i))

        const similarAdjacent = getAdjacentSimilarPix(ctx, actualX, actualY, pixObj, baseColor, ignorePixs)
        notProcessed.push(...similarAdjacent)
    }

    return { data: Object.values(pixObj), minX: 0, maxX: 0, minY: 0, maxY: 0 }
}

function getAdjacentSimilarPix(ctx, x, y, pixObj, baseColor, ignorePixs) {
    const existingSimilarAdjacents = []
    const adjacent = getAdjacentPixels(x, y)
    for (const [x2, y2] of adjacent) {
        const xInFrame = x2 > offset.x && x2 < offset.x + offset.w
        const yInFrame = y2 > offset.y && y2 < offset.y + offset.h
        const hasNotBeenProcessedAlready = typeof pixObj[x2 + '-' + y2] === 'undefined'
        if (xInFrame && yInFrame && hasNotBeenProcessedAlready) {
            const colorDiff = getPixelsDifference(getPixelAtCoord(ctx, x, y, offset), baseColor)
            const addrStr = x2 + '-' + y2
            if (!ignorePixs.includes(addrStr)) {
                existingSimilarAdjacents.push([x2, y2, colorDiff])
            }
        }
    }
    if (existingSimilarAdjacents.length <= 2) return []
    existingSimilarAdjacents.forEach(([x, y, colorDiff]) => pixObj[x + '-' + y] = [x, y, colorDiff])
    return existingSimilarAdjacents
}

function getAdjacentPixels(x, y) {
    return [[x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 1, y], [x + 1, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]]
}

/**
 * @returns 1 => very different ; 0 => exacltly similar
 */
function getPixelsDifference(color1, color2) {
    const [r1, g1, b1] = color1
    const [h1, s1, l1] = rgbToHsl(r1, g1, b1)
    const [r2, g2, b2] = color2 // getPixelAtCoord(ctx, x2, y2)
    const [h2, s2, l2] = rgbToHsl(r2, g2, b2)

    const similarity = ((Math.abs(h1 - h2) + Math.abs(s1 - s2) + Math.abs(l1 - l2)) / 3)
    // const similarity = Math.max(Math.abs(h1 - h2), Math.abs(s1 - s2), Math.abs(l1 - l2))

    // maxDif = Math.max(maxDif, similarity)
    // minDiff = Math.min(minDiff, similarity)
    return similarity
}

function distance(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
}