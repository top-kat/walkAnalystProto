
import '@tensorflow/tfjs-backend-webgl';
import '@mediapipe/pose';

import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';

tfjsWasm.setWasmPaths(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`);

import * as posedetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';

import { config } from './00_config.js';
import { setBackendAndEnvFlags } from './util'
import { drawResult } from './draw'
import setupGui from './gui-config.js'

const dom = config.dom = {
  canvas: document.getElementById('output'),
  video: document.getElementById('video'),
  cnv1: document.getElementById('cnv1'),
  cnv2: document.getElementById('cnv2'),
  cnv3: document.getElementById('cnv3'),
  cnv4: document.getElementById('cnv4'),
}
const ctx = config.ctx = dom.canvas.getContext('2d')
config.ctx1 = dom.cnv1.getContext('2d')
config.ctx2 = dom.cnv2.getContext('2d')
config.ctx3 = dom.cnv3.getContext('2d')
config.ctx4 = dom.cnv4.getContext('2d')

let detector

let renderTimeout
const renderResultsWithTimeout = () => {
  clearTimeout(renderTimeout)
  renderTimeout = setTimeout(renderResult, 150);
}

export async function renderResult() {
  const [pose] = await detector.estimatePoses(dom.video, { maxPoses: 1, flipHorizontal: false })
  if (pose) drawResult(pose, ctx, dom.video)
}

async function updateVideo() {
  dom.video.load();
  await new Promise(resolve => {
    dom.video.onloadeddata = resolve
  })

  const videoWidth = dom.video.videoWidth;
  const videoHeight = dom.video.videoHeight;
  dom.video.width = videoWidth;
  dom.video.height = videoHeight;
  dom.canvas.width = videoHeight * 0.7;
  dom.canvas.height = videoHeight;
  for (const cnv of ['cnv1', 'cnv2', 'cnv3', 'cnv4']) {
    dom[cnv].width = videoHeight * 0.7;
    dom[cnv].height = videoHeight;
  }

}

let paused = false
async function app() {

  setupGui(renderResultsWithTimeout)

  detector = await posedetection.createDetector(config.model, {
    runtime: 'tfjs',
    modelType: 'full',
  })

  await setBackendAndEnvFlags(config.flags, config.backend)

  // <ONLY FOR TFJS>
  const warmUpTensor = tf.fill([dom.video.videoHeight, dom.video.videoWidth, 3], 0, 'float32');

  await detector.estimatePoses(
    warmUpTensor,
    { maxPoses: 1, flipHorizontal: false }
  );
  warmUpTensor.dispose();
  // </ONLY FOR TFJS>

  await updateVideo()

  const updateRenderButton = document.getElementById('updateRender')
  updateRenderButton.onclick = renderResult

  document.getElementById('playPauseRender').onclick = () => paused = !paused

  // dom.video.onseeked = renderResult

  dom.video.oncanplaythrough = () => console.log('CANPLAY')

  dom.video.oncanplaythrough = () => console.log('CANPLAY2')

  setTimeout(async () => {
    // await renderResult()
    renderOnPlay()
  }, 1500);
};

async function renderOnPlay() {
  if (paused) setTimeout(() => requestAnimationFrame(renderOnPlay), 1000)
  else {
    dom.video.currentTime += 0.04
    if (dom.video.currentTime > dom.video.duration) dom.video.currentTime = 0
    dom.video.oncanplaythrough = async () => {
      await renderResult()
      setTimeout(() => requestAnimationFrame(renderOnPlay), 1000)
    }
  }
}

app();
