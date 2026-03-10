import express from 'express';
import authRouter from './auth.js';

export default function routes() {
  const router = express.Router();
  router.use('/auth', authRouter);
  return router;
}