import { Router } from 'express';

import User from '../../controllers/user';

const userRoutes = Router();

userRoutes.post('/', User.store);

export default userRoutes;
