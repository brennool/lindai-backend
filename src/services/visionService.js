/**
 * Google Cloud Vision API Service - DEBUG MODE
 * Hardcoded API key for debugging
 */

/**
 * Analyze face image using Google Vision API
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} Analysis results with landmarks and metrics
 */
export async function analyzeFaceImage(imageBuffer) {
    // HARDCODED API KEY FOR DEBUG
    const apiKey = "AIzaSyDuOeFnvZVLkHYlZHhQny3QXy47-V65LHM";

    console.log('📸 Analyzing face image with Google Vision API...');
    console.log('🔑 Using API Key:', apiKey.substring(0, 20) + '...');

    // Convert buffer to base64
    let base64Image = imageBuffer.toString('base64');

    // Clean base64 header if present
    base64Image = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    const requestBody = {
        requests: [
            {
                image: { content: base64Image },
                features: [
                    { type: "FACE_DETECTION", maxResults: 1 },
                    { type: "LANDMARK_DETECTION", maxResults: 1 }
                ]
            }
        ]
    };

    console.log('📤 Sending request to Google Vision...');
    console.log('📦 Request body size:', JSON.stringify(requestBody).length, 'bytes');

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    console.log('📥 Response status:', response.status, response.statusText);

    const data = await response.json();

    // LOG EVERYTHING - NO FILTERING
    console.log('🔍 FULL RAW RESPONSE FROM GOOGLE:');
    console.log(JSON.stringify(data, null, 2));

    // Check for Google API error
    if (data.error) {
        console.error('❌ GOOGLE API ERROR DETECTED:');
        console.error('Error Code:', data.error.code);
        console.error('Error Message:', data.error.message);
        console.error('Error Status:', data.error.status);
        console.error('Full Error Object:', JSON.stringify(data.error, null, 2));

        throw new Error(`GOOGLE_API_ERROR: ${data.error.message} (Code: ${data.error.code})`);
    }

    if (!response.ok) {
        console.error('❌ HTTP ERROR:', response.status, response.statusText);
        console.error('Response body:', JSON.stringify(data, null, 2));
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${JSON.stringify(data)}`);
    }

    const faceAnnotations = data.responses[0].faceAnnotations;

    // Validate face detection
    if (!faceAnnotations || faceAnnotations.length === 0) {
        console.log('⚠️ NO FACE DETECTED');
        console.log('Full response:', JSON.stringify(data.responses[0], null, 2));
        throw new Error('NO_FACE_DETECTED');
    }

    // Check for multiple faces
    if (faceAnnotations.length > 1) {
        console.log('⚠️ Multiple faces detected');
        throw new Error('MULTIPLE_FACES');
    }

    const face = faceAnnotations[0];

    // Check detection confidence
    if (face.detectionConfidence < 0.6) {
        console.log('⚠️ Low detection confidence:', face.detectionConfidence);
        throw new Error('LOW_QUALITY');
    }

    // Extract landmarks
    const landmarks = extractFacialLandmarks(face);

    console.log('✅ Face detected! Landmarks received.');
    console.log('📍 Extracted', Object.keys(landmarks).length, 'facial landmarks');

    // Calculate metrics
    const metrics = calculateBeautyMetrics(landmarks);

    console.log('✅ Face analysis completed successfully');
    console.log('📊 Metrics:', metrics);

    return {
        landmarks,
        metrics,
        confidence: face.detectionConfidence,
        rawResponse: face
    };
}

/**
 * Extract facial landmarks from Google Vision API response
 * @param {Object} faceAnnotation - Face annotation from Vision API
 * @returns {Object} Extracted landmarks
 */
export function extractFacialLandmarks(faceAnnotation) {
    const landmarkMap = {};

    // Google Vision landmark types mapping
    const landmarkTypes = {
        'LEFT_EYE': 'leftEye',
        'RIGHT_EYE': 'rightEye',
        'NOSE_TIP': 'noseTip',
        'MOUTH_LEFT': 'mouthLeft',
        'MOUTH_RIGHT': 'mouthRight',
        'MOUTH_CENTER': 'mouthCenter',
        'LEFT_EYEBROW_UPPER_MIDPOINT': 'leftEyebrowUpper',
        'RIGHT_EYEBROW_UPPER_MIDPOINT': 'rightEyebrowUpper',
        'CHIN_GNATHION': 'chinGnathion',
        'FOREHEAD_GLABELLA': 'foreheadGlabella',
        'MIDPOINT_BETWEEN_EYES': 'nasion',
        'UPPER_LIP': 'upperLip',
        'LOWER_LIP': 'lowerLip',
        'LEFT_OF_LEFT_EYEBROW': 'leftCheek',
        'RIGHT_OF_RIGHT_EYEBROW': 'rightCheek'
    };

    faceAnnotation.landmarks.forEach(landmark => {
        const key = landmarkTypes[landmark.type];
        if (key) {
            landmarkMap[key] = {
                x: landmark.position.x,
                y: landmark.position.y,
                z: landmark.position.z || 0
            };
        }
    });

    console.log('📍 Extracted', Object.keys(landmarkMap).length, 'facial landmarks');
    return landmarkMap;
}

/**
 * Calculate beauty metrics from facial landmarks
 * @param {Object} landmarks - Facial landmarks
 * @returns {Object} Beauty metrics (7 points)
 */
export function calculateBeautyMetrics(landmarks) {
    const metrics = {
        simetria: calculateSymmetry(landmarks),
        proporcaoVertical: calculateVerticalProportion(landmarks),
        anguloMandibula: calculateJawlineAngle(landmarks),
        harmoniaOlhosNarizBoca: calculateFacialHarmony(landmarks),
        proporcaoLabial: calculateLipProportion(landmarks),
        sobrancelhas: calculateEyebrowScore(landmarks),
        projecaoQueixo: calculateChinProjection(landmarks)
    };

    console.log('📊 Calculated metrics:', metrics);
    return metrics;
}

/**
 * Calculate Euclidean distance between two points
 */
function distance(p1, p2) {
    return Math.sqrt(
        Math.pow(p2.x - p1.x, 2) +
        Math.pow(p2.y - p1.y, 2)
    );
}

/**
 * Calculate facial symmetry (0-100)
 */
function calculateSymmetry(landmarks) {
    const { leftEye, rightEye, noseTip, mouthLeft, mouthRight, nasion } = landmarks;

    if (!leftEye || !rightEye || !noseTip || !mouthLeft || !mouthRight) {
        return 70;
    }

    const centerX = nasion ? nasion.x : noseTip.x;
    const measurements = [
        { left: leftEye.x, right: rightEye.x },
        { left: mouthLeft.x, right: mouthRight.x }
    ];

    let totalSymmetry = 0;
    measurements.forEach(({ left, right }) => {
        const leftDist = Math.abs(left - centerX);
        const rightDist = Math.abs(right - centerX);
        const maxDist = Math.max(leftDist, rightDist);

        if (maxDist > 0) {
            const symmetry = 100 - (Math.abs(leftDist - rightDist) / maxDist * 100);
            totalSymmetry += Math.max(0, symmetry);
        }
    });

    const avgSymmetry = totalSymmetry / measurements.length;
    return Math.round(Math.min(95, Math.max(50, avgSymmetry)));
}

/**
 * Calculate vertical facial proportion (0-100)
 */
function calculateVerticalProportion(landmarks) {
    const { foreheadGlabella, nasion, noseTip, chinGnathion } = landmarks;

    if (!foreheadGlabella || !noseTip || !chinGnathion) {
        return 72;
    }

    const topPoint = nasion || foreheadGlabella;
    const upperThird = Math.abs(noseTip.y - topPoint.y);
    const lowerThird = Math.abs(chinGnathion.y - noseTip.y);

    if (upperThird === 0 || lowerThird === 0) {
        return 72;
    }

    const ratio = Math.min(upperThird, lowerThird) / Math.max(upperThird, lowerThird);
    const score = ratio * 100;

    return Math.round(Math.min(92, Math.max(55, score)));
}

/**
 * Calculate jawline angle score (0-100)
 */
function calculateJawlineAngle(landmarks) {
    const { leftCheek, rightCheek, chinGnathion, mouthCenter } = landmarks;

    if (!leftCheek || !rightCheek || !chinGnathion) {
        return 68;
    }

    const jawWidth = distance(leftCheek, rightCheek);
    const faceHeight = mouthCenter ? Math.abs(chinGnathion.y - mouthCenter.y) * 3 : 200;
    const ratio = jawWidth / faceHeight;
    const idealRatio = 0.65;
    const deviation = Math.abs(ratio - idealRatio) / idealRatio;
    const score = Math.max(0, 100 - (deviation * 100));

    return Math.round(Math.min(88, Math.max(55, score)));
}

/**
 * Calculate facial harmony (0-100)
 */
function calculateFacialHarmony(landmarks) {
    const { leftEye, rightEye, noseTip, mouthCenter, chinGnathion, foreheadGlabella } = landmarks;

    if (!leftEye || !rightEye || !noseTip || !mouthCenter) {
        return 75;
    }

    const goldenRatio = 1.618;
    const ratios = [];

    const eyeDistance = distance(leftEye, rightEye);
    const noseToMouth = distance(noseTip, mouthCenter);

    if (noseToMouth > 0) {
        const ratio1 = eyeDistance / noseToMouth;
        const deviation1 = Math.abs(ratio1 - goldenRatio) / goldenRatio;
        ratios.push(Math.max(0, 100 - (deviation1 * 100)));
    }

    if (foreheadGlabella && chinGnathion) {
        const faceHeight = distance(foreheadGlabella, chinGnathion);
        const faceWidth = eyeDistance * 1.5;

        if (faceWidth > 0) {
            const ratio2 = faceHeight / faceWidth;
            const deviation2 = Math.abs(ratio2 - goldenRatio) / goldenRatio;
            ratios.push(Math.max(0, 100 - (deviation2 * 100)));
        }
    }

    if (ratios.length === 0) return 75;

    const avgScore = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
    return Math.round(Math.min(92, Math.max(60, avgScore)));
}

/**
 * Calculate lip proportion score (0-100)
 */
function calculateLipProportion(landmarks) {
    const { upperLip, lowerLip, mouthCenter } = landmarks;

    if (!upperLip || !lowerLip || !mouthCenter) {
        return 74;
    }

    const upperLipHeight = Math.abs(mouthCenter.y - upperLip.y);
    const lowerLipHeight = Math.abs(lowerLip.y - mouthCenter.y);

    if (lowerLipHeight === 0) return 74;

    const ratio = upperLipHeight / lowerLipHeight;
    const idealRatio = 0.625;
    const deviation = Math.abs(ratio - idealRatio) / idealRatio;
    const score = Math.max(0, 100 - (deviation * 100));

    return Math.round(Math.min(90, Math.max(60, score)));
}

/**
 * Calculate eyebrow score (0-100)
 */
function calculateEyebrowScore(landmarks) {
    const { leftEyebrowUpper, rightEyebrowUpper, leftEye, rightEye } = landmarks;

    if (!leftEyebrowUpper || !rightEyebrowUpper || !leftEye || !rightEye) {
        return 71;
    }

    const leftArch = Math.abs(leftEyebrowUpper.y - leftEye.y);
    const rightArch = Math.abs(rightEyebrowUpper.y - rightEye.y);
    const avgArch = (leftArch + rightArch) / 2;
    const eyeDistance = distance(leftEye, rightEye);
    const idealArch = eyeDistance * 0.15;
    const deviation = Math.abs(avgArch - idealArch) / idealArch;
    const score = Math.max(0, 100 - (deviation * 100));

    return Math.round(Math.min(88, Math.max(58, score)));
}

/**
 * Calculate chin projection score (0-100)
 */
function calculateChinProjection(landmarks) {
    const { chinGnathion, mouthCenter, noseTip } = landmarks;

    if (!chinGnathion || !mouthCenter || !noseTip) {
        return 69;
    }

    const chinToMouth = Math.abs(chinGnathion.y - mouthCenter.y);
    const noseToMouth = Math.abs(noseTip.y - mouthCenter.y);

    if (noseToMouth === 0) return 69;

    const ratio = chinToMouth / noseToMouth;
    const idealRatio = 1.3;
    const deviation = Math.abs(ratio - idealRatio) / idealRatio;
    const score = Math.max(0, 100 - (deviation * 100));

    return Math.round(Math.min(85, Math.max(55, score)));
}
