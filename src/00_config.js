/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */


export const config = {
  model: "BlazePose",
  backend: 'tfjs-webgl', // webgl backend is more performant while wasm is more compatible
  flags: {},
  modelConfig: {
    maxPoses: 1,
    type: 'tfjs', // only one compatible with react native
  },
  // DRAW GENERAL OPTIONS
  offset: { x: 0, y: 0, w: 0, h: 0 }, // will be auto adjusted
  ignorePointsIndex: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22],

  // EDGE DETECTION
  displayEdgeDetection: false,
  blur_radius: 0,
  low_threshold: 1,
  high_threshold: 85,
  // POSE DETECTION
  pointConfidenceScoreMin: 0.55,
  lineWidth: 2,
  radius: 2,
  // COLOR SEGMENTATION
  displayColorSegmentation: false,
  displayHslValues: false,
  maxDifferenceBetween2groundPixels: 0.07,
  maxDiffTresholdForDifferentColors: 0.11,
  areaMaxDifferencePercent: 10,
  hueInfluence: 0,
  saturationInfluence: 0,
  luminosityInfluence: 1,
  takeRelativePixelForZoneDetection: true,
  // 3D RENDER
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  // MISC
  st: { groundYavg: 999 },
};
