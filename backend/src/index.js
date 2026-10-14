import express from 'express';
import cors from 'cors';
import communityRouter from './community.js';
import accountsRouter from './accounts.js';
import {migrate} from './migrate.js';
import rafflesRouter, { refreshAutomaticRaffles } from './routes/raffles.js';

const app = express();
app.use(cors());
app.use(express.json({limit:'4mb'}));
app.use('/api/account', accountsRouter);
app.use('/api/community',communityRouter);
app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'NEP' }));
app.use('/api/raffles', rafflesRouter);
app.use((err, _req, res, _next) => {
  console.dir(err, { depth: null });
  console.dir(err.precedingErrors, { depth: null });
  res.status(err.status || 500).json({ message: err.status ? err.message : err.precedingErrors?.[0]?.message || err.originalError?.message || 'Ocurrió un error inesperado.' });
});
await migrate();
app.listen(process.env.PORT || 3000, () => {
  console.log('NEP API disponible en puerto 3000');
  refreshAutomaticRaffles().catch(console.error);
  setInterval(() => refreshAutomaticRaffles().catch(console.error), 60_000);
});
