import { Router } from 'express';
import { exportTransactionsCSV } from '../controllers/exportController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);
router.get('/transactions', exportTransactionsCSV);

export default router;
