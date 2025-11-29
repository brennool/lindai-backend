import express from 'express';
import multer from 'multer';
import { analyzeFaceImage } from '../services/visionService.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

/**
 * POST /api/analyze-face
 * Analyze uploaded face image
 * DEPRECATED: Analysis is now done client-side with face-api.js
 */
// router.post('/analyze-face', upload.single('image'), async (req, res) => {
try {
    console.log('📸 Received face analysis request');

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No image file provided'
        });
    }

    console.log(`📁 Image received: ${req.file.originalname}, size: ${req.file.size} bytes`);

    // Analyze the image
    const analysisResult = await analyzeFaceImage(req.file.buffer);

    // Generate a "sales score" between 60-72 for conversion optimization
    const salesScore = Math.floor(Math.random() * (72 - 60 + 1)) + 60;

    console.log(`✅ Analysis complete. Sales score: ${salesScore}`);

    res.json({
        success: true,
        score: salesScore, // Random score for conversion (not the real analysis)
        metrics: analysisResult.metrics,
        landmarks: analysisResult.landmarks,
        message: 'Face analysis completed successfully'
    });

} catch (error) {
    console.error('❌ Error analyzing face:', error);
    console.error('📋 Error stack:', error.stack);
    console.error('📋 Error details:', JSON.stringify(error, null, 2));

    // Handle specific Vision API errors
    if (error.message === 'NO_FACE_DETECTED') {
        return res.status(400).json({
            success: false,
            error: 'NO_FACE',
            message: 'Rosto não detectado. Por favor, envie uma foto com boa iluminação e seu rosto visível.',
            technicalDetails: 'Google Vision API returned no face annotations'
        });
    }

    if (error.message === 'MULTIPLE_FACES') {
        return res.status(400).json({
            success: false,
            error: 'MULTIPLE_FACES',
            message: 'Múltiplos rostos detectados. Por favor, envie uma foto com apenas um rosto.',
            technicalDetails: 'Multiple face annotations detected'
        });
    }

    if (error.message === 'LOW_QUALITY') {
        return res.status(400).json({
            success: false,
            error: 'LOW_QUALITY',
            message: 'Qualidade da imagem muito baixa. Por favor, envie uma foto mais nítida com boa iluminação.',
            technicalDetails: 'Detection confidence below 60%'
        });
    }

    if (error.message === 'API_KEY_MISSING') {
        return res.status(500).json({
            success: false,
            error: 'CONFIG_ERROR',
            message: 'Erro de configuração do servidor. Por favor, tente novamente mais tarde.',
            technicalDetails: 'GOOGLE_VISION_API_KEY not found in environment variables'
        });
    }

    if (error.message === 'VISION_API_ERROR') {
        return res.status(500).json({
            success: false,
            error: 'VISION_API_ERROR',
            message: 'Erro ao comunicar com Google Vision API.',
            technicalDetails: error.message
        });
    }

    // Generic error with full details
    res.status(500).json({
        success: false,
        message: 'Erro ao analisar imagem.',
        error: error.message,
        technicalDetails: {
            message: error.message,
            stack: error.stack,
            name: error.name
        }
    });
}
// });

export default router;
