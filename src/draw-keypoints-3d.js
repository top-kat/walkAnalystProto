import * as posedetection from '@tensorflow-models/pose-detection'
import * as scatter from './libs/scatter-gl/index.js'
import { config } from './00_config.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// const scene = new THREE.Scene();
const canvas3delm = document.getElementById('render-3d')
// const camera = new THREE.PerspectiveCamera(75, canvas3delm.innerWidth / canvas3delm.innerHeight, 0.1, 1000);
// const renderer = new THREE.WebGLRenderer({
//     antialias: true,
//     canvas: canvas3delm,
// });
// renderer.setSize(canvas3delm.clientWidth, canvas3delm.clientHeight)
// renderer.setAnimationLoop(animation)
// document.body.appendChild(renderer.domElement);



// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// camera.position.z = 5;

// function animation(time) {
//     cube.rotation.x = time / 2000;
//     cube.rotation.y = time / 1000;

//     renderer.render(scene, camera);
// }


const camera = new THREE.OrthographicCamera(-100, 100, -100, 100, 0.01, 10);
const camera2 = new THREE.PerspectiveCamera(70, canvas3delm.clientWidth / canvas3delm.clientHeight, 0.01, 10);

camera.position.z = 1;

const scene = new THREE.Scene();

// const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
// const material = new THREE.MeshNormalMaterial();

// const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(canvas3delm.clientWidth, canvas3delm.clientHeight);
canvas3delm.appendChild(renderer.domElement);

const bodyGroup = new THREE.Group();
scene.add(bodyGroup);

const controls = new OrbitControls(camera, renderer.domElement);

setInterval(() => {
    controls.update()
}, 50);

export function drawKeypoints3D(keypoints) {

    // mesh.rotation.x += 25;
    // mesh.rotation.y += 25;

    // renderer.render(scene, camera);


    // const sprite = new THREE.Sprite(material);
    // scene.add(sprite);

    renderer.render(scene, camera);

}

function InitializeScene() {
    const spriteCoords = []
    kps.forEach(({ x, y, z, score, name }) => {
        const sprite1 = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#69f' }));
        sprite1.position.set(x, y, z);
        sprite1.scale.set(0.01, 0.01, 0.01);
        bodyGroup.add(sprite1);
    })
    renderer.render(scene, camera);
}


const kps = JSON.parse("[{\"x\":-0.005996667141434264,\"y\":-0.6493514700376741,\"z\":-0.11740899085998535,\"score\":0.9999556533022547,\"name\":\"nose\"},{\"x\":-0.026611707364789336,\"y\":-0.6881140345976238,\"z\":-0.10317587852478027,\"score\":0.9999435307761719,\"name\":\"left_eye_inner\"},{\"x\":-0.026278644400082332,\"y\":-0.6883808090555917,\"z\":-0.10265183448791504,\"score\":0.9999249377704601,\"name\":\"left_eye\"},{\"x\":-0.02637928967153555,\"y\":-0.6889143189487926,\"z\":-0.10257768630981445,\"score\":0.9999359339484502,\"name\":\"left_eye_outer\"},{\"x\":-0.04128303029345513,\"y\":-0.6791349342970866,\"z\":-0.12562179565429688,\"score\":0.9999550294424846,\"name\":\"right_eye_inner\"},{\"x\":-0.04097194987685607,\"y\":-0.6800872531380587,\"z\":-0.1264185905456543,\"score\":0.9999506961230148,\"name\":\"right_eye\"},{\"x\":-0.04156113492637324,\"y\":-0.6812403013754471,\"z\":-0.12580275535583496,\"score\":0.9999492027282112,\"name\":\"right_eye_outer\"},{\"x\":-0.08485789068516814,\"y\":-0.6760437029228893,\"z\":-0.00029921531677246094,\"score\":0.9997484736245873,\"name\":\"left_ear\"},{\"x\":-0.15602578749631174,\"y\":-0.6394269714660629,\"z\":-0.12029743194580078,\"score\":0.9999780814666765,\"name\":\"right_ear\"},{\"x\":-0.02042729439414824,\"y\":-0.6244024838059069,\"z\":-0.07894158363342285,\"score\":0.9999527681944501,\"name\":\"mouth_left\"},{\"x\":-0.04107328891200909,\"y\":-0.6120466214131978,\"z\":-0.11230945587158203,\"score\":0.999962655932462,\"name\":\"mouth_right\"},{\"x\":-0.011659518404904125,\"y\":-0.4944706396197698,\"z\":0.10812611877918243,\"score\":0.9998753240486823,\"name\":\"left_shoulder\"},{\"x\":-0.19830386994193883,\"y\":-0.4353029992199405,\"z\":-0.15796422958374023,\"score\":0.999965778634064,\"name\":\"right_shoulder\"},{\"x\":0.0952940863443598,\"y\":-0.28886809921635376,\"z\":0.013702988624572754,\"score\":0.5598957825544627,\"name\":\"left_elbow\"},{\"x\":-0.08382267029594673,\"y\":-0.21901334158345523,\"z\":-0.1345091611146927,\"score\":0.9900031775429956,\"name\":\"right_elbow\"},{\"x\":0.07669312800296349,\"y\":-0.2506119351165869,\"z\":-0.18627071380615234,\"score\":0.48807763589850534,\"name\":\"left_wrist\"},{\"x\":0.10600499551035694,\"y\":-0.2171395642351792,\"z\":-0.07092940807342529,\"score\":0.9477459817664875,\"name\":\"right_wrist\"},{\"x\":0.06408581945867986,\"y\":-0.21122841448457008,\"z\":-0.2255406379699707,\"score\":0.39516494990244144,\"name\":\"left_pinky\"},{\"x\":0.16400819157216864,\"y\":-0.19573749345105054,\"z\":-0.08653903007507324,\"score\":0.9006233740730613,\"name\":\"right_pinky\"},{\"x\":0.03238092213827152,\"y\":-0.24175254788750455,\"z\":-0.21950221061706543,\"score\":0.40737720190345533,\"name\":\"left_index\"},{\"x\":0.15279603395058955,\"y\":-0.24079789470950821,\"z\":-0.09663701057434082,\"score\":0.895556355453992,\"name\":\"right_index\"},{\"x\":0.057030166334229054,\"y\":-0.25453211181086494,\"z\":-0.1913893222808838,\"score\":0.38487500319996365,\"name\":\"left_thumb\"},{\"x\":0.11253867049443524,\"y\":-0.23193973899545775,\"z\":-0.0737760066986084,\"score\":0.8396565276439564,\"name\":\"right_thumb\"},{\"x\":0.08242830429415424,\"y\":-0.007177041363006109,\"z\":0.08565139770507812,\"score\":0.9999044294614559,\"name\":\"left_hip\"},{\"x\":-0.08284495687094227,\"y\":0.006772496837367649,\"z\":-0.08430767059326172,\"score\":0.9996800789309634,\"name\":\"right_hip\"},{\"x\":0.16991098252053097,\"y\":0.3675299568865026,\"z\":0.05753815174102783,\"score\":0.9072767664695349,\"name\":\"left_knee\"},{\"x\":-0.10178617578629712,\"y\":0.3791020558067849,\"z\":-0.016889244318008423,\"score\":0.9836191170987582,\"name\":\"right_knee\"},{\"x\":0.23524657998021886,\"y\":0.7296072481425306,\"z\":0.08314657211303711,\"score\":0.9626916477289245,\"name\":\"left_ankle\"},{\"x\":-0.340236036556732,\"y\":0.6256899054171186,\"z\":0.18694353103637695,\"score\":0.9587094235098945,\"name\":\"right_ankle\"},{\"x\":0.25495873918710615,\"y\":0.7724661006952249,\"z\":0.07738828659057617,\"score\":0.9230744869256807,\"name\":\"left_heel\"},{\"x\":-0.3644401711591506,\"y\":0.6627606857017122,\"z\":0.2017817497253418,\"score\":0.7774775252178842,\"name\":\"right_heel\"},{\"x\":0.39199369409860113,\"y\":0.7780808142521164,\"z\":0.007905006408691406,\"score\":0.9641733699886879,\"name\":\"left_foot_index\"},{\"x\":-0.31886348077167415,\"y\":0.7300180537840174,\"z\":0.13350486755371094,\"score\":0.949884471067703,\"name\":\"right_foot_index\"}]")

InitializeScene()


// let scatterGLHasInitialized = false;
// const scatterGLEl = document.getElementById('render-3d');
// const scatterGL = new scatter.ScatterGL(scatterGLEl, {
//     // rotateOnStart: true,
//     selectEnabled: false,
//     styles: { polyline: { defaultOpacity: 1, deselectedOpacity: 1 } },
// });
// scatterGLEl.style = `height: 576px;width:50vw;`;
// scatterGL.resize()



// export function drawKeypoints3D(keypoints) {
    // const scoreThreshold = 0;
    // const pointsData = keypoints.map((keypoint) => ([-keypoint.x, -keypoint.y, -keypoint.z]));

    // const dataset = new scatter.ScatterGL.Dataset(pointsData);

    // const keypointInd = posedetection.util.getKeypointIndexBySide(config.model);
    // scatterGL.setPointColorer((i) => {
    //     if (keypoints[i] == null || keypoints[i].score < scoreThreshold) return '#0000ff';
    //     if (i === 0) return '#ff0000'
    //     if (keypointInd.left.indexOf(i) > -1) return '#00ff00'
    //     if (keypointInd.right.indexOf(i) > -1) return '#ffa500'
    // });

    // if (!scatterGLHasInitialized) scatterGL.render(dataset)
    // else scatterGL.updateDataset(dataset)

    // const connections = posedetection.util.getAdjacentPairs(config.model);
    // const sequences = connections.map((pair) => ({ indices: pair }));
    // scatterGL.setSequences(sequences);
    // scatterGLHasInitialized = true;
// }