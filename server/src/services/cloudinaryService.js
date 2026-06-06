import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const uploadDir = path.resolve('public/uploads');

// Ensure local upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Check if Cloudinary is configured
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== 'mock-cloudinary' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('☁️ Cloudinary storage configured.');
} else {
  console.log('📂 Local storage upload fallback configured (no Cloudinary credentials).');
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

export const cloudinaryService = {
  async uploadImage(filePath) {
    if (isCloudinaryConfigured) {
      try {
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'flavoratlas',
          transformation: [{ width: 800, height: 600, crop: 'limit' }]
        });
        // Remove local temporary file
        try { fs.unlinkSync(filePath); } catch (e) {}
        return result.secure_url;
      } catch (err) {
        console.error('⚠️ Cloudinary Upload Failed, falling back to local file path:', err);
      }
    }
    
    // Fallback: return the relative local URL path
    const filename = path.basename(filePath);
    return `/uploads/${filename}`;
  }
};

export default cloudinaryService;
