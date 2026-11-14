import 'dotenv/config'; // must be the FIRST import
import express from 'express';
import cors from 'cors';
import patientsRouter from './routes/patient.js';
import analyzeRouter from './routes/analyze.js';
import chatRouter from './routes/chat.js';
import { loadSamples } from './services/samples.js';
import { errorHandler } from './errors.js';
import cors from 'cors'

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://preeminent-meerkat-0b39a6.netlify.app",
  ],
}));
loadSamples(); // fails at startup if lab_reports is missing

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json({ limit: '200kb' }));

app.get('/', (req, res) => res.send('Hello World'));
app.use('/api', patientsRouter, analyzeRouter, chatRouter);

app.use((req, res) =>
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }));
app.use(errorHandler); // last

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.on('error', (err) => {
  console.error(err);
  process.exit(1);
});