import * as posedetection from '@tensorflow-models/pose-detection'
import { config } from './00_config.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { moyenne } from 'topkat-utils';

const canvas3delm = document.getElementById('render-3d')
const isOrthoCam = false

const aspect = canvas3delm.clientWidth / canvas3delm.clientHeight
const frustumSize = 2
const orthoCamera = new THREE.OrthographicCamera(
    (frustumSize * aspect / - 2), // L
    (frustumSize * aspect / 2), // R
    (frustumSize / 2) - 0.3, // T
    (frustumSize / - 2) - 0.3, // B
    0.1, 1000
);
const perspectiveCam = new THREE.PerspectiveCamera(100, canvas3delm.clientWidth / canvas3delm.clientHeight, 0.01, 100)
const camera = isOrthoCam ? orthoCamera : perspectiveCam

camera.position.z = 1;

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setSize(canvas3delm.clientWidth, canvas3delm.clientHeight)
canvas3delm.appendChild(renderer.domElement)

const bodyGroup = new THREE.Group()
scene.add(bodyGroup)

const axesHelper = new THREE.AxesHelper(0.1);
scene.add(axesHelper);

// const geometry = new THREE.BoxGeometry(100, 0.01, 100);
const geometry = new THREE.GridHelper(100, 100, 0x002233, 0x002233);
// const material = new THREE.MeshBasicMaterial({ color: 0x003300 });
// const ground = new THREE.Mesh(geometry, material);
// ground.position.z -= 10
geometry.position.z -= 10
scene.add(geometry);

const sprites = []
const lines = []
let groundY = []

const controls = new OrbitControls(camera, renderer.domElement);

const lineConnections = [...posedetection.util.getAdjacentPairs(config.model)]
lineConnections.push([33, 34, '#c00']) // line between middle of shoulders and mdl of hips
lineConnections.push([35, 36, '#c00']) // 

export function drawKeypoints3D(keypoints = []) {
    if (keypoints.length) {

        const kps = keypoints.map(({ x, y, z }) => new THREE.Vector3(x, -y, z))

        const betweenShouldersPoint = getPointInBetweenByPerc(kps[11], kps[12], 0.5)
        const betweenHipsPoint = getPointInBetweenByPerc(kps[23], kps[24], 0.5)
        const betweenHipsShoulderLeftPoint = getPointInBetweenByPerc(kps[12], kps[24], 0.5)
        const betweenHipsShoulderRightPoint = getPointInBetweenByPerc(kps[11], kps[23], 0.5)
        const bodyCenter = getPointInBetweenByPerc(betweenHipsShoulderLeftPoint, betweenHipsShoulderRightPoint, 0.5)

        kps.push(betweenShouldersPoint, betweenHipsPoint, betweenHipsShoulderLeftPoint, betweenHipsShoulderRightPoint, bodyCenter)

        kps.forEach(({ x, y, z }, index) => {
            if (config.ignorePointsIndex.includes(index)) sprites[index] = null
            else if (sprites[index]) {
                // SPRITE EXISTS
                sprites[index].position.set(x - bodyCenter.x, y - bodyCenter.y, z - bodyCenter.z)
            } else {
                // FIRST TIME RENDER
                sprites[index] = drawSprite(x - bodyCenter.x, y - bodyCenter.y, z - bodyCenter.z, index > 32 ? '#f00' : '#fff')
            }
        })

        // compute floor with heel position
        if (groundY.length < 100) {
            const posA = new THREE.Vector3() // 
            const posB = new THREE.Vector3() // 
            sprites[29].getWorldPosition(posA)
            sprites[30].getWorldPosition(posB)
            groundY.push(posA.y, posB.y)
            if (groundY.length >= 1) {
                const minValue = Math.min(...groundY)
                const maxVal = Math.max(...groundY)
                const maxVal2 = minValue + (maxVal - minValue) * 0.1
                const filtered = groundY.filter(y => y < maxVal2)
                config.st.groundYavg = moyenne(filtered)
                geometry.position.y = config.st.groundYavg - 0.05
            }
        }

        lines.forEach(l => bodyGroup.remove(l))
        lineConnections.forEach(([aIndex, bIndex, color = '#fff'], index) => {
            if (config.ignorePointsIndex.includes(aIndex) || config.ignorePointsIndex.includes(bIndex)) return
            const [aPos, bPos] = [sprites[aIndex].position, sprites[bIndex].position]
            lines[index] = drawLine(aPos, bPos, color)
        })

        // NORMALIZE POSITION
        rotateMaxIter = 0
        rotateUntilOk(35, 36, 'y', 'x', 'z')
        rotateUntilOk(35, 36, 'x', 'y', 'z')
        // rotateUntilOk(33, 34, 'z', 'x', 'y')

        controls.update();

        renderer.render(scene, camera)
    }
}


let rotateMaxIter = 0
function rotateUntilOk(spriteIndex1, spriteIndex2, rotationAxis, testAxis, zTestAxis = 'z') {
    const bodyLeftPos = new THREE.Vector3() // betweenHipsShoulderLeftPoint
    const bodyRightPos = new THREE.Vector3() // betweenHipsShoulderRightPoint
    const maxDiff = 0.005
    sprites[spriteIndex1].getWorldPosition(bodyLeftPos)
    sprites[spriteIndex2].getWorldPosition(bodyRightPos)
    const aIsCloserToCam = bodyLeftPos[zTestAxis] > bodyRightPos[zTestAxis]
    const zTest = () => aIsCloserToCam ? bodyLeftPos[zTestAxis] > bodyRightPos[zTestAxis] : bodyLeftPos[zTestAxis] < bodyRightPos[zTestAxis]

    let i = 0
    while (Math.abs(bodyLeftPos[testAxis] - bodyRightPos[testAxis]) > maxDiff || !zTest()) {
        bodyGroup.rotation[rotationAxis] += 0.005
        sprites[spriteIndex1].getWorldPosition(bodyLeftPos)
        sprites[spriteIndex2].getWorldPosition(bodyRightPos)
        if (i++ > 9999) break
    }
    if (rotateMaxIter > 9999) throw new Error('Max iteration reached for rotation')
}

function getPointInBetweenByPerc(pointA, pointB, percentage) {
    var dir = pointB.clone().sub(pointA);
    var len = dir.length();
    dir = dir.normalize().multiplyScalar(len * percentage);
    return pointA.clone().add(dir);
}

function drawSprite(x, y, z, color = '#69f') {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ color }))
    sprite.position.set(x, y, z)
    sprite.scale.set(0.01, 0.01, 0.01)
    bodyGroup.add(sprite)
    return sprite
}

function drawLine(ptA, ptB, color = '#fff') {
    const material = new THREE.LineBasicMaterial({ color })
    const points = [ptA, ptB]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, material)
    bodyGroup.add(line)
    return line
}

