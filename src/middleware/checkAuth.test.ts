import { checkAuth } from './checkAuth';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

describe('checkAuth middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should return 401 if no Authorization header', () => {
    checkAuth(req as Request, res as Response, next as NextFunction);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is missing', () => {
    req.headers = { authorization: 'Bearer' };
    checkAuth(req as Request, res as Response, next as NextFunction);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach user and call next if token is valid', () => {
    req.headers = { authorization: 'Bearer validtoken' };
    jest.spyOn(jwt, 'verify').mockImplementation(() => ({ id: '123', email: 'test@test.com' }));
    checkAuth(req as Request, res as Response, next as NextFunction);
    expect(req.user).toEqual({ id: '123', email: 'test@test.com' });
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    req.headers = { authorization: 'Bearer invalidtoken' };
    jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('Invalid token'); });
    checkAuth(req as Request, res as Response, next as NextFunction);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token verification failed' });
    expect(next).not.toHaveBeenCalled();
  });
});
