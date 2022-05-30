


export function getKeyPoints(keypoints) {
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
        shoulderRight, // 11
        shoulderLeft, // 12
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
        hipLeft, // 24
        kneeRight,
        kneeLeft, // 26
        ankleRight, // cheville
        ankleLeft, // 28
        heelRight, // talon
        heelLeft, // 30
        footIndexRight, // pointe de pied
        footIndexLeft, // 32
    ] = keypoints
    return { nose, eyeRightInner, eyeRight, eyeRightOuter, eyeLeftInner, eyeLeft, eyeLeftOuter, earRight, earLeft, mouthRight, mouthLeft, shoulderRight, shoulderLeft, elbowRight, elbowLeft, wristRight, wristLeft, pinkyKnuckleRight, pinkyKnuckleLeft, indexKnuckleRight, indexKnuckleLeft, thumbKnuckleRight, thumbKnuckleLeft, hipRight, hipLeft, kneeRight, kneeLeft, ankleRight, ankleLeft, heelRight, heelLeft, footIndexRight, footIndexLeft }
}