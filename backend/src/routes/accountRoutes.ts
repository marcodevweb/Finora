import { Router } from 'express';
import { getAccounts, createAccount } from '../controllers/accountController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getAccounts);
router.post('/', createAccount);

export default router;
