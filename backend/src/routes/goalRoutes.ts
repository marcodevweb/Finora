import { Router } from 'express';
import { getGoals, createGoal, addContribution, deleteGoal } from '../controllers/goalController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getGoals);
router.post('/', createGoal);
router.post('/:id/contributions', addContribution);
router.delete('/:id', deleteGoal);

export default router;
