import { Router } from 'express';
import {
  createFolder,
  getFolder,
  getRootFolders,
  renameFolder,
  deleteFolder,
  shareFolder,
  getSharedWithMe,
} from '../controllers/folder.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/', createFolder);
router.get('/root', getRootFolders);
router.get('/shared-with-me', getSharedWithMe);
router.get('/:id', getFolder);
router.patch('/:id', renameFolder);
router.delete('/:id', deleteFolder);
router.post('/:id/share', shareFolder);

export default router;