const fs = require('fs');
const path = require('path');
const { Name } = require('../models');
const { AppError, ErrorCodes } = require('../utils/errorCodes');
const logger = require('../utils/logger');

const getFileUrl = (filename) => {
	if (!filename) return null;
	return `${process.env.BACKEND_URL}/uploads/pdfs/${filename}`;
};

const deleteFile = (filepath) => {
	try {
		if (filepath && fs.existsSync(filepath)) {
			fs.unlinkSync(filepath);
		}
	} catch (error) {
		logger.error(`Failed to delete file: ${filepath}`, error);
	}
};

const getNames = async (req, res, next) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;
		const search = req.query.search || '';
		const isActive = req.query.isActive;

		const query = {};

		if (search) {
			query.name = { $regex: search, $options: 'i' };
		}

		if (isActive !== undefined) {
			query.isActive = isActive === 'true';
		}

		const [names, total] = await Promise.all([
			Name.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Name.countDocuments(query),
		]);

		const formattedNames = names.map((nameDoc) => ({
			...nameDoc,
			pdfFile: nameDoc.pdfFilePath ? getFileUrl(path.basename(nameDoc.pdfFilePath)) : null,
		}));

		res.json({
			success: true,
			data: formattedNames,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		next(error);
	}
};

const getName = async (req, res, next) => {
	try {
		const { id } = req.params;

		const name = await Name.findById(id).lean();

		if (!name) {
			throw new AppError('Name not found', ErrorCodes.NOT_FOUND, 404);
		}

		const formattedName = {
			...name,
			pdfFile: name.pdfFilePath ? getFileUrl(path.basename(name.pdfFilePath)) : null,
		};

		res.json({
			success: true,
			data: formattedName,
		});
	} catch (error) {
		next(error);
	}
};

const createName = async (req, res, next) => {
	try {
		const { name } = req.body;
		const file = req.file;

		if (!name || name.trim() === '') {
			throw new AppError('Name is required', ErrorCodes.INVALID_INPUT, 400);
		}

		const existingName = await Name.findOne({ name: name.trim() });
		if (existingName) {
			// Clean up uploaded file if name already exists
			if (file) {
				deleteFile(file.path);
			}
			throw new AppError('Name already exists', ErrorCodes.INVALID_INPUT, 400);
		}

		const nameData = {
			name: name.trim(),
			createdBy: req.admin._id,
		};

		// Add PDF file path if file was uploaded
		if (file && file.mimetype === 'application/pdf') {
			nameData.pdfFilePath = file.path;
		}

		const newName = await Name.create(nameData);

		logger.info(`Name created: ${newName.name} by admin ${req.telegramId}`);

		res.status(201).json({
			success: true,
			data: {
				_id: newName._id,
				name: newName.name,
				pdfFilePath: newName.pdfFilePath,
				pdfFile: newName.pdfFilePath ? getFileUrl(path.basename(newName.pdfFilePath)) : null,
				isActive: newName.isActive,
				createdAt: newName.createdAt,
			},
		});
	} catch (error) {
		// Clean up uploaded file on error
		if (req.file) {
			deleteFile(req.file.path);
		}
		next(error);
	}
};

const updateName = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { name, isActive } = req.body;
		const file = req.file;

		const nameDoc = await Name.findById(id);

		if (!nameDoc) {
			// Clean up uploaded file if name not found
			if (file) {
				deleteFile(file.path);
			}
			throw new AppError('Name not found', ErrorCodes.NOT_FOUND, 404);
		}

		if (name !== undefined) {
			if (name.trim() === '') {
				// Clean up uploaded file if validation fails
				if (file) {
					deleteFile(file.path);
				}
				throw new AppError('Name cannot be empty', ErrorCodes.INVALID_INPUT, 400);
			}
			
			// Check if name already exists (excluding current document)
			const existingName = await Name.findOne({ 
				name: name.trim(), 
				_id: { $ne: id } 
			});
			if (existingName) {
				// Clean up uploaded file if name already exists
				if (file) {
					deleteFile(file.path);
				}
				throw new AppError('Name already exists', ErrorCodes.INVALID_INPUT, 400);
			}
			
			nameDoc.name = name.trim();
		}

		if (isActive !== undefined) {
			nameDoc.isActive = isActive === 'true' || isActive === true;
		}

		// Handle PDF file upload
		if (file && file.mimetype === 'application/pdf') {
			// Delete old PDF file if exists
			if (nameDoc.pdfFilePath) {
				deleteFile(nameDoc.pdfFilePath);
			}
			nameDoc.pdfFilePath = file.path;
		}

		await nameDoc.save();

		logger.info(`Name updated: ${nameDoc.name} by admin ${req.telegramId}`);

		res.json({
			success: true,
			data: {
				_id: nameDoc._id,
				name: nameDoc.name,
				pdfFilePath: nameDoc.pdfFilePath,
				pdfFile: nameDoc.pdfFilePath ? getFileUrl(path.basename(nameDoc.pdfFilePath)) : null,
				isActive: nameDoc.isActive,
				updatedAt: nameDoc.updatedAt,
			},
		});
	} catch (error) {
		// Clean up uploaded file on error
		if (req.file) {
			deleteFile(req.file.path);
		}
		next(error);
	}
};

const deleteName = async (req, res, next) => {
	try {
		const { id } = req.params;

		const name = await Name.findById(id);

		if (!name) {
			throw new AppError('Name not found', ErrorCodes.NOT_FOUND, 404);
		}

		// Delete associated PDF file if exists
		if (name.pdfFilePath) {
			deleteFile(name.pdfFilePath);
		}

		await Name.findByIdAndDelete(id);

		logger.info(`Name deleted: ${name.name} by admin ${req.telegramId}`);

		res.json({
			success: true,
			message: 'Name deleted successfully',
			deletedName: {
				_id: name._id,
				name: name.name,
			},
		});
	} catch (error) {
		next(error);
	}
};

module.exports = {
	getNames,
	getName,
	createName,
	updateName,
	deleteName,
};

