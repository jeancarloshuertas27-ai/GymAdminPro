import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const uploadBaseDir = path.resolve(process.cwd(), 'uploads');
const vouchersDir = path.join(uploadBaseDir, 'vouchers');
const photosDir = path.join(uploadBaseDir, 'photos');
const bannersDir = path.join(uploadBaseDir, 'banners');
const productosDir = path.join(uploadBaseDir, 'productos');

// Asegurar existencia de carpetas
fs.mkdirSync(vouchersDir, { recursive: true });
fs.mkdirSync(photosDir, { recursive: true });
fs.mkdirSync(bannersDir, { recursive: true });
fs.mkdirSync(productosDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'voucher' || file.fieldname === 'comprobante') {
      cb(null, vouchersDir);
    } else if (file.fieldname === 'banner') {
      cb(null, bannersDir);
    } else if (file.fieldname === 'imagen' || file.fieldname === 'foto_producto') {
      cb(null, productosDir);
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
      cb(new Error('Formato no permitido. Solo se aceptan JPG, PNG, WEBP o PDF.'));
    }
  },
});
