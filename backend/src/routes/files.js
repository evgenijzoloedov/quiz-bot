const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const authMiddleware = require('../middleware/auth');
const { uploadSingleFile } = require('../middleware/upload');

// All routes require authentication
router.use(authMiddleware);

// POST /api/upload
router.post('/upload', uploadSingleFile, fileController.uploadFile);

// GET /api/files
router.get('/', fileController.getFiles);

// DELETE /api/files/:filename
router.delete('/:filename', fileController.deleteFile);

module.exports = router;

