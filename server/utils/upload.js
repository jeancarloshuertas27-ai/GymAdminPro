import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const uploadBaseDir = path.resolve(process.cwd(), 'uploads');
const vouchersDir = path.join(uploadBaseDir, 'vouchers');
const photosDir = path.join(uploadBaseDir, 'photos');

// Asegurar existencia de carpetas
fs.mkdirSync(vouchersDir, { recursive: true });
fs.mkdirSync(photosDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'voucher') {
      cb(null, vouchersDir);
    } else {
      cb(null, photosDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máx
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|webp/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato no permitido. Solo se aceptan JPG, PNG o PDF.'));
    }
  },
});

