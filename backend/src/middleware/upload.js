const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Storage for fail images (only images)
const failImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/fail-images';
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const uniqueId = uuidv4().slice(0, 8);
    const sanitizedName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 30);
    
    cb(null, `${timestamp}_${uniqueId}_${sanitizedName}${ext}`);
  }
});

const imageFileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (!allowedImageTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, WEBP, GIF images are allowed'), false);
  }
  
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = './uploads/images';
    
    if (file.mimetype === 'application/pdf') {
      uploadDir = './uploads/pdfs';
    } else if (file.mimetype.startsWith('video/')) {
      uploadDir = './uploads/videos';
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const uniqueId = uuidv4().slice(0, 8);
    const sanitizedName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 30);
    
    cb(null, `${timestamp}_${uniqueId}_${sanitizedName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedPdfTypes = ['application/pdf'];
  const allowedVideoTypes = [
    'video/mp4',
    'video/quicktime', // MOV
    'video/webm',
    'video/x-msvideo', // AVI
    'video/x-matroska', // MKV
    'video/mp4v-es',
    'video/3gpp', // 3GP
    'video/x-flv', // FLV
    'video/x-ms-wmv', // WMV
    'video/m4v' // M4V
  ];
  const allowedTypes = [...allowedImageTypes, ...allowedPdfTypes, ...allowedVideoTypes];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF, PDF and video formats (MP4, MOV, WEBM, AVI, MKV, etc.) are allowed.'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024 // 20MB
  },
  fileFilter: fileFilter
});

// Upload configurations for different use cases
const uploadCharacterFiles = upload.fields([
  { name: 'successMeme', maxCount: 1 },
  { name: 'failMeme', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]);

const uploadQuestionFiles = upload.fields([
  { name: 'image', maxCount: 1 }
]);

const uploadQuizVideo = upload.fields([
  { name: 'successVideo', maxCount: 1 }
]);

const uploadSingleFile = upload.single('pdfFile');

// PDF-only upload for names
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const uploadPdfOnly = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024 // 20MB
  },
  fileFilter: pdfFileFilter
}).single('pdfFile');

const uploadFailImage = multer({
  storage: failImageStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024 // 20MB
  },
  fileFilter: imageFileFilter
}).single('image');

module.exports = {
  upload,
  uploadCharacterFiles,
  uploadQuestionFiles,
  uploadQuizVideo,
  uploadSingleFile,
  uploadPdfOnly,
  uploadFailImage
};

