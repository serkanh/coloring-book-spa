import express from 'express';
import dotenv from 'dotenv';

// Import with dynamic require to work around TypeScript issues
const { pdfController } = require('../controllers/pdfController');
const { authMiddleware } = require('../utils/authMiddleware');

dotenv.config();

const router = express.Router();

// PDF generation routes
router.post('/generate', authMiddleware, pdfController.generatePDF);
router.get('/status/:jobId', authMiddleware, pdfController.getPdfStatus);
router.get('/list', authMiddleware, pdfController.listUserPdfs);

export default router;
