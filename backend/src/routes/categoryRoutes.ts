import { Router } from 'express';
import { getCategories, createCategory, deleteCategory } from '../controllers/categoryController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getCategories);
router.post('/', createCategory);
router.delete('/:id', deleteCategory);

export default router;
