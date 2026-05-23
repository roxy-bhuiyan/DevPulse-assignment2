import { Router } from 'express';
import { signup, login } from './auth.controller';

const router = Router();



// signup and login router---------------


router.post('/signup', signup);
router.post('/login', login);

export default router;
