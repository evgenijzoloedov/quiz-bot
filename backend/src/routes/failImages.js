const express = require('express');
const router = express.Router();
const failImageController = require('../controllers/failImageController');
const authMiddleware = require('../middleware/auth');
const { uploadFailImage } = require('../middleware/upload');
const { validate, schemas } = require('../middleware/validate');

// All routes require authentication
router.use(authMiddleware);

// GET /api/fail-images
router.get('/', failImageController.getFailImages);

// GET /api/fail-images/:id
router.get('/:id', failImageController.getFailImage);

// POST /api/fail-images
router.post('/', uploadFailImage, failImageController.createFailImage);

// PUT /api/fail-images/:id
router.put('/:id', failImageController.updateFailImage);

// DELETE /api/fail-images/:id
router.delete('/:id', failImageController.deleteFailImage);

// POST /api/fail-images/:id/reorder
router.post('/:id/reorder', validate(schemas.reorderQuestion), failImageController.reorderFailImage);

module.exports = router;

