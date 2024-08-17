import type { Response, Request, NextFunction } from 'express';

export default async function requiredApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { authorization } = req.headers;

  if (!authorization || authorization !== process.env.API_KEY) {
    res
      .status(401)
      .json({ error: { message: 'Sorry, you do not have authorization' } });
    return;
  }

  return next();
}
