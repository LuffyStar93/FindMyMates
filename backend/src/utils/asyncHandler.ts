import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wrappe un handler (sync ou async) et route toute erreur vers next(err).
 * Usage: router.get('/x', asyncHandler(ctrl));
 */
export function asyncHandler<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
>(fn: (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => any): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    try {
      const out = fn(req, res, next);
      if (out && typeof (out as Promise<any>).then === "function") {
        (out as Promise<any>).catch(next);
      }
    } catch (err) {
      next(err);
    }
  };
}