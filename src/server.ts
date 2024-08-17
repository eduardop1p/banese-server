import 'dotenv/config';

import { server } from './app';

const port = process.env.PORT;

server.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
