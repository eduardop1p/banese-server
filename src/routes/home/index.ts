import { Router } from 'express';

import Home from '../../controllers/home';

const homeRoutes = Router();

homeRoutes.get('/', Home.index);

export default homeRoutes;
