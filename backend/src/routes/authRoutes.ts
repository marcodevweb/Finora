import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);

export default router;
