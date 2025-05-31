import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically if you want to inspect/test them in browser
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
import invoiceRouter from './controllers/invoice.controller';
app.use('/api/invoice', invoiceRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
