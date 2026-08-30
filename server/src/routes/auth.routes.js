import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, changePassword } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Rate limiter for login to prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per `window` (here, per 15 minutes)
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware to disable register route if flag is set
const checkRegisterEnabled = (req, res, next) => {
  if (process.env.DISABLE_REGISTER === 'true') {
    return res.status(403).json({ error: 'Registration is disabled.' });
  }
  next();
};

router.post('/register', checkRegisterEnabled, register);
router.post('/login', loginLimiter, login);
router.get('/me', authenticateToken, getMe);
router.put('/change-password', authenticateToken, changePassword);

export default router;
