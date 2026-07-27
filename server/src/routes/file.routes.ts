import { Router } from 'express';
import multer from 'multer';
import { uploadFile, downloadFile, removeFile } from '../controllers/file.controller';
import { authMiddleware } from '../middleware/auth';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
router.use(authMiddleware);

router.post('/', upload.single('file'), uploadFile);
router.get('/:id/download', downloadFile);
router.delete('/:id', removeFile);

export default router;