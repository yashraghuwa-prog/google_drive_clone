import { Router } from 'express';
import { createFolder, getFolder, getRootFolders, renameFolder, deleteFolder } from '../controllers/folder.controller';
import { authMiddleware } from '../middleware/auth'; // check this matches your actual export name/path

const router = Router();

router.use(authMiddleware);

router.post('/', createFolder);
router.get('/root', getRootFolders);   // must be registered BEFORE /:id below
router.get('/:id', getFolder);
router.patch('/:id', renameFolder);
router.delete('/:id', deleteFolder);

export default router;