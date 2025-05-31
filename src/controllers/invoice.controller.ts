import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { processInvoiceFile } from '../services/invoice.service';

const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: (_req, file, cb) => {
    // Accept only xls or xlsx
    if (
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .xls and .xlsx files are allowed'));
    }
  },
});

const router = Router();

router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const result = await processInvoiceFile(req.file.path);

      res.json(result);
    } catch (err: any) {
      console.error('[invoice.controller] Error:', err);
      res
        .status(500)
        .json({ error: 'Failed to process invoice file', details: err?.message });
    }
  }
);


export default router;
