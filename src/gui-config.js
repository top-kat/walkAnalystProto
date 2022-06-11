
import dat from 'dat.gui'
import { config } from './00_config.js'

export default function setupGui(renderFn) {
    const gui = new dat.GUI();

    // EDGE DETECTION
    const edgeDetectionFolder = gui.addFolder('EdgeDetection')
    edgeDetectionFolder.add(config, 'displayEdgeDetection').onChange(renderFn)
    edgeDetectionFolder.add(config, 'blur_radius', 0, 4).step(1).onChange(renderFn)
    edgeDetectionFolder.add(config, 'low_threshold', 1, 127).step(1).onChange(renderFn)
    edgeDetectionFolder.add(config, 'high_threshold', 1, 127).step(1).onChange(renderFn)

    // POSE DETECTION
    const poseDetectionConfigFolder = gui.addFolder('poseDetectionConfig')
    poseDetectionConfigFolder.add(config, 'pointConfidenceScoreMin', 0, 1).step(0.05).onChange(renderFn)

    // COLOR SEGMENTATION
    const colorSegmentationFolder = gui.addFolder('colorSegmentationFolder')
    colorSegmentationFolder.add(config, 'displayColorSegmentation').onChange(renderFn)
    colorSegmentationFolder.add(config, 'displayHslValues').onChange(renderFn)
    colorSegmentationFolder.add(config, 'maxDifferenceBetween2groundPixels', 0, 1).step(0.01).onChange(renderFn)
    colorSegmentationFolder.add(config, 'maxDiffTresholdForDifferentColors', 0, 1).step(0.01).onChange(renderFn)
    // colorSegmentationFolder.add(config, 'areaMaxDifferencePercent', 0, 100).step(1).onChange(renderFn)

    colorSegmentationFolder.add(config, 'hueInfluence', 0, 1).step(0.1).onChange(renderFn)
    colorSegmentationFolder.add(config, 'saturationInfluence', 0, 1).step(0.1).onChange(renderFn)
    colorSegmentationFolder.add(config, 'luminosityInfluence', 0, 1).step(0.1).onChange(renderFn)

    // 3D RENDER
    const render3Dfolder = gui.addFolder('render 3D')
    render3Dfolder.add(config, 'rotateX', 0, 6.28).step(0.1)
    render3Dfolder.add(config, 'rotateY', 0, 6.28).step(0.1)
    render3Dfolder.add(config, 'rotateZ', 0, 6.28).step(0.1)



    edgeDetectionFolder.open()
    poseDetectionConfigFolder.open()
    colorSegmentationFolder.open()
    render3Dfolder.open()
}
