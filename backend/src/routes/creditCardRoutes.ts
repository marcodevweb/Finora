import { Router } from 'express';
import { getCreditCards, createCreditCard, deleteCreditCard } from '../controllers/creditCardController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getCreditCards);
router.post('/', createCreditCard);
router.delete('/:id', deleteCreditCard);

export default router;
