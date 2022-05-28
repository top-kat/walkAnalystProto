
import * as posedetection from '@tensorflow-models/pose-detection';
import { config } from './00_config.js';
import $ from 'jquery'
import { edgeDetector } from './edge-detection'
import { getKeyPoints } from './get-keypoints.js'
import { drawKeypoints3D } from './draw-keypoints-3d.js'
import { drawKeypoint, drawSkeleton } from './draw-keypoints.js'
import { rgbToHsl, getPixelAtCoord, setPixelForCoord, distance, isBlack, forEachPixOfSquare, getPixelsDifference } from './draw-utils'

import { moyenne, isset, round2 } from 'topkat-utils'

const maxShoeDetectionArea = 2500 // TODO make this relative


export function drawResult(pose, ctx, video) {

    const { keypoints, keypoints3D } = pose
    if (keypoints != null) {

        const frameBorderOffset = 50
        let xMin = 9999
        let yMin = 9999
        let xMax = 0
        let yMax = 0

        for (const [i, keyPoint] of Object.entries(keypoints)) {
            if (!config.ignorePointsIndex.includes(i)) {
                const { x, y /*, z, name, score*/ } = keyPoint
                xMin = Math.min(x, xMin)
                yMin = Math.min(y, yMin)
                xMax = Math.max(x, xMax)
                yMax = Math.max(y, yMax)
            }
        }
        config.offset = {
            x: Math.round(xMin - frameBorderOffset),
            y: Math.round(yMin - frameBorderOffset),
            w: Math.round(xMax - xMin + frameBorderOffset * 2),
            h: Math.round(yMax - yMin + frameBorderOffset * 2),
        }

        ctx.clearRect(0, 0, video.videoWidth, video.videoHeight)

        ctx.drawImage(video, config.offset.x, config.offset.y, config.offset.w, config.offset.h, 0, 0, config.offset.w, config.offset.h)

        drawKeypoints(keypoints, ctx);
        drawSkeleton(keypoints, ctx);
        drawKeypoints3D(keypoints3D);
    }
}

let footAvgArea = []

function drawKeypoints(keypoints, ctx) {

    if (config.displayHslValues) drawHslValues()

    if (config.displayEdgeDetection) edgeDetector(ctx)

    const namedKeypoints = getKeyPoints(keypoints)
    const {
        kneeRight,
        kneeLeft,
        ankleRight, // cheville
        ankleLeft,
        heelRight, // talon
        heelLeft,
        footIndexRight, // pointe de pied
        footIndexLeft,
    } = namedKeypoints

    const st = {}

    // TODO take in account confidence score
    const walkDirection = st.walkDirection = footIndexRight.x > heelRight.x ? 'leftToRight' : 'rightToLeft'

    const moyRightFoot = { x: moyenne([footIndexRight.x, heelRight.x, ankleRight.x]), y: moyenne([footIndexRight.y, heelRight.y, ankleRight.y]) }
    const moyLeftFoot = { x: moyenne([footIndexLeft.x, heelLeft.x, ankleLeft.x]), y: moyenne([footIndexLeft.y, heelLeft.y, ankleLeft.y]) }

    const rightFootPosition = st.rightFootPosition = moyRightFoot.x > moyLeftFoot.x ? 'right' : 'left'
    const frontFoot = st.frontFoot = rightFootPosition === 'right' ? (walkDirection === 'leftToRight' ? 'right' : 'left') : (walkDirection === 'leftToRight' ? 'left' : 'right')



    const talonChevilleDistMoy = moyenne([
        Math.abs(distance(kneeRight.x, kneeRight.y, ankleRight.x, ankleRight.y)),
        Math.abs(distance(kneeLeft.x, kneeLeft.y, ankleLeft.x, ankleLeft.y))
    ])

    const shoePixelObjects = []
    for (const lOrR of ['Left', 'Right']) {
        const isLeft = lOrR === 'Left'

        const leftMostFootItem = walkDirection === 'rightToLeft' ? namedKeypoints[`footIndex${lOrR}`].x : Math.min(namedKeypoints[`heel${lOrR}`].x, namedKeypoints[`ankle${lOrR}`].x)
        const rightMostFootItem = walkDirection === 'rightToLeft' ? Math.max(namedKeypoints[`heel${lOrR}`].x, namedKeypoints[`ankle${lOrR}`].x) : footIndexRight.x
        st.shoeColor = ''
        const shoePixObject = findShoeColorZone(
            ctx, st,
            isLeft ? moyLeftFoot.x : moyRightFoot.x,
            isLeft ? moyLeftFoot.y : moyRightFoot.y,
            talonChevilleDistMoy / 2,
            (isLeft ? ankleLeft.y : ankleRight.y) - talonChevilleDistMoy * 0.15,
            rightMostFootItem + talonChevilleDistMoy * 0.3,
            leftMostFootItem - talonChevilleDistMoy * 0.3,
        )
        shoePixelObjects.push([lOrR, shoePixObject])
    }

    for (const [lOrR, { groundPixels, shoePixels, differentPixels }] of shoePixelObjects) {
        const isLeft = lOrR === 'Left'

        if (config.displayColorSegmentation) {
            drawPixelCluster(ctx, groundPixels, [0, 255, 0, 0.5])
            drawPixelCluster(ctx, differentPixels, [255, 0, 0, 0.5])
            drawPixelCluster(ctx, shoePixels, [0, 0, 255, 0.5])
        }
        const footArea = shoePixels.length

        footAvgArea.push(footArea)
        if (footAvgArea.length) {
            const avgFootArea = moyenne(footAvgArea)

            st[`avg${lOrR}FootArea`] = avgFootArea

            st[`foot${lOrR}DetectionConfidence`] = round2((1 / avgFootArea) * footArea)

            if (footAvgArea.length > 10) footAvgArea.shift()
        }
    }

    const keypointInd = posedetection.util.getKeypointIndexBySide(config.model);

    ctx.lineWidth = config.lineWidth;

    drawKeypoint(ctx, moyRightFoot, 'Red')
    drawKeypoint(ctx, moyLeftFoot, 'Red')

    for (const i of keypointInd.middle) if (!config.ignorePointsIndex.includes(i)) drawKeypoint(ctx, keypoints[i], 'Red')
    for (const i of keypointInd.left) if (!config.ignorePointsIndex.includes(i)) drawKeypoint(ctx, keypoints[i], 'Green')
    for (const i of keypointInd.right) if (!config.ignorePointsIndex.includes(i)) drawKeypoint(ctx, keypoints[i], 'Orange')

    $('#dataTable').remove()
    $('#dataWrapper').append(`<table id='dataTable'>${Object.entries(st).map(([name, val]) => `<tr><td>${name}</td><td>${val}</td></tr>`).join('')}</table>`)
}



function findShoeColorZone(ctx, st, x, y, size, minShoeY, maxShoeX, minShoeX) {

    x = Math.round(x)
    y = Math.round(y)
    size = Math.round(size)
    minShoeY = Math.round(minShoeY)
    maxShoeX = Math.round(maxShoeX)
    minShoeX = Math.round(minShoeX)

    const minX = Math.round(x - size)
    const minY = Math.round(y - size)
    const maxX = Math.round(x + size)
    const maxY = Math.round(y + size)
    const confidenceScore = { floorDetection: 0, shoeDetection: 0 }

    const forEachPixOfShoeSquare = (callback, xStart = minX, yStart = minY) => {
        forEachPixOfSquare(ctx, callback, xStart, yStart, maxX, maxY)
    }



    // SHOE COLOR
    const shoeAvgPix = [[x, y], ...getAdjacentPixels(x, y)].map(pix => getPixelAtCoord(ctx, pix[0], pix[1], config.offset))
    const shoeColor = [moyenne(shoeAvgPix.map(c => c[0])), moyenne(shoeAvgPix.map(c => c[1])), moyenne(shoeAvgPix.map(c => c[2]))]
    st.shoeColor += `<span class='colorSwatch' style='background-color:rgb(${shoeColor.join(',')})'></span>`

    // FIND GROUND COLOR by analysing the base pixel line
    const groundColors = [] // :[[r,g,b], nbOccurence, diffWithShoeColor]
    forEachPixOfShoeSquare((X, Y, color) => {
        if (isBlack(color)) return
        let similarColorObj = groundColors.find(colorObj => getPixelsDifference(color, colorObj[0]) < config.maxDifferenceBetween2groundPixels)
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
            forEachPixOfShoeSquare((X, Y, color) => {
                if (getPixelsDifference(groundColor, color) <= Math.min(config.maxDifferenceBetween2groundPixels, maxDiffForGroundPixels)) {
                    groundPixels[`${X}-${Y}`] = [X, Y]
                }
            })
        }
    }
    confidenceScore.floorDetection = st.floorDetectionConfidence = Math.min(1, (1 / 0.3) * moyenne(colorDifferencesWithShoe))

    // MARK DIFFERENTS PIXELS ON IMAGE
    const differentPixels = {}
    forEachPixOfShoeSquare((X, Y, color) => {
        if (!isset(groundPixels[`${X}-${Y}`]) && getPixelsDifference(color, shoeColor) > config.maxDiffTresholdForDifferentColors) {
            differentPixels[`${X}-${Y}`] = [X, Y]
        }
    })

    // SHOE PIX CLUSTER
    const shoePixCluster = getColorZoneAroundPoint(ctx, x, y, { minX: minShoeX, maxX: maxShoeX, minY: minShoeY, maxY: 9999 }, shoeColor, Object.keys({ ...differentPixels, ...groundPixels }))

    // TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO
    // * enlever tout les pixels aux extrémités * 2
    // * prendre le milieu et trouver les pixels adjacents
    // * remplir les trous
    // * 
    // TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO

    return { data: [], groundPixels: Object.values(groundPixels), differentPixels: Object.values(differentPixels), shoePixels: shoePixCluster.data, minX: 0, maxX: 0, minY: 0, maxY: 0 }
}




function drawPixelCluster(ctx, pixels, color) {
    for (const [x, y] of pixels) setPixelForCoord(ctx, x, y, color, config.offset)
}




function getColorZoneAroundPoint(ctx, x, y, maxDim, baseColor, ignorePixs = []) {
    const pixCache = {}
    const notProcessed = [[x, y]]
    pixCache[x + '-' + y] = [x, y, 0]
    const { minX, maxX, minY, maxY } = maxDim
    const output = { area: 0, minX: 9999, maxX: 0, minY: 9999, maxY: 0, nbPixOutOfZone: 0 }
    while (notProcessed.length && Object.keys(pixCache).length < maxShoeDetectionArea) {
        let [actualX, actualY] = notProcessed.shift().map(i => Math.round(i))

        if (actualX > minX && actualX < maxX && actualY > minY && actualY < maxY) {
            output.area++
            output.minX = Math.min(output.minX, actualX)
            output.maxX = Math.max(output.maxX, actualX)
            output.minY = Math.min(output.minY, actualY)
            output.maxY = Math.max(output.maxY, actualY)

            const colorToCompareWith = config.takeRelativePixelForZoneDetection ? getPixelAtCoord(ctx, actualX, actualY) : baseColor
            const similarAdjacent = getAdjacentSimilarPix(ctx, actualX, actualY, pixCache, colorToCompareWith, ignorePixs)
            notProcessed.push(...similarAdjacent)
        } else output.nbPixOutOfZone++
    }

    output.data = Object.values(pixCache)
    return output
}

function getAdjacentSimilarPix(ctx, x, y, pixObj, baseColor, ignorePixs) {
    const existingSimilarAdjacents = []
    const adjacent = getAdjacentPixels(x, y)
    for (const [x2, y2] of adjacent) {
        const xInFrame = x2 > config.offset.x && x2 < config.offset.x + config.offset.w
        const yInFrame = y2 > config.offset.y && y2 < config.offset.y + config.offset.h
        const hasNotBeenProcessedAlready = typeof pixObj[x2 + '-' + y2] === 'undefined'
        if (xInFrame && yInFrame && hasNotBeenProcessedAlready) {
            const colorDiff = getPixelsDifference(getPixelAtCoord(ctx, x, y, config.offset), baseColor)
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




function drawHslValues() {
    forEachPixOfSquare(config.ctx, (x, y, [r, g, b]) => {
        const [h, s, l] = rgbToHsl(r, g, b)
        setPixelForCoord(config.ctx1, x, y, [h * 255, h * 255, h * 255])
        setPixelForCoord(config.ctx2, x, y, [s * 255, s * 255, s * 255])
        setPixelForCoord(config.ctx3, x, y, [l * 255, l * 255, l * 255])
    })
}