import express from 'express'
import patientsRouter from './routes/patient.js'
import analyzeRouter from './routes/analyze.js'
import chatRouter from './routes/chat.js'
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '200kb' }));
app.use('/api', patientsRouter, analyzeRouter, chatRouter);
app.use(errorHandler); // last
app.get('/', (req, res) => {
  res.send('Hello World');
});

const PORT = 8000;
app.listen(PORT, (err) => {
if(err)
{
console.log(err)}
  console.log(`Server running on port `+PORT);
});