import { Router } from 'express';
import { create, getAll, getOne, update, remove } from './issues.controller';
import { authenticate, authorizeMaintainer } from '../../middleware/auth';

const router = Router();

router.post('/', authenticate, create);
router.get('/', getAll);
router.get('/:id', getOne);
router.patch('/:id', authenticate, update);
router.delete('/:id', authenticate, authorizeMaintainer, remove);

export default router;
