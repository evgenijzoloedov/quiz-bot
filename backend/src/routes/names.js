const express = require('express');
const router = express.Router();
const nameController = require('../controllers/nameController');
const authMiddleware = require('../middleware/auth');
const { uploadPdfOnly } = require('../middleware/upload');

// All routes require authentication
router.use(authMiddleware);

// GET /api/names
router.get('/', nameController.getNames);

// GET /api/names/:id
router.get('/:id', nameController.getName);

// POST /api/names
router.post('/', uploadPdfOnly, nameController.createName);

// PUT /api/names/:id
router.put('/:id', uploadPdfOnly, nameController.updateName);

// DELETE /api/names/:id
router.delete('/:id', nameController.deleteName);

module.exports = router;

