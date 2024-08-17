/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Request, Response } from 'express';

class Home {
  public index(req: Request, res: Response) {
    return res.json({
      status: 200,
    });
  }
}

export default new Home();
