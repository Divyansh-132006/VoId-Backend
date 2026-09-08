import 'dotenv/config';
import { createServer } from 'node:http';
import { join } from 'node:path';
import express from 'express';
import { createDatabase } from './db/database';
import { CallRepository } from './db/callRepository';
import { ChallengeRepository } from './db/challengeRepository';
import { DashboardRepository } from './db/dashboardRepository';
import { EventRepository } from './db/eventRepository';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createCallRoutes } from './routes/callRoutes';
import { createChallengeRoutes } from './routes/challengeRoutes';
import { createDashboardRoutes } from './routes/dashboardRoutes';
import { createEventRoutes } from './routes/eventRoutes';
import { CallService } from './services/callService';
import { ChallengeService } from './services/challengeService';
import { DashboardService } from './services/dashboardService';
import { EventService } from './services/eventService';
import { attachSignaling } from './websocket/signaling';

const database = createDatabase();
const callService = new CallService(new CallRepository(database));
const challengeService = new ChallengeService(new ChallengeRepository(database));
const dashboardService = new DashboardService(new DashboardRepository(database));
const eventService = new EventService(new EventRepository(database), new CallRepository(database));
const app = express();
const server = createServer(app);

app.use(express.json());
app.get('/health', (_request, response) => {
  response.json({ status: 'ok', version: '1.0.0' });
});
app.get('/signal-test', (_request, response) => {
  response.sendFile(join(__dirname, '..', 'signal-test.html'));
});
app.get('/dashboard', (_request, response) => {
  response.sendFile(join(__dirname, '..', 'dashboard', 'index.html'));
});
app.use('/api/calls', createCallRoutes(callService));
app.use('/api/challenges', createChallengeRoutes(challengeService));
app.use('/api/dashboard', createDashboardRoutes(dashboardService));
app.use('/api/events', createEventRoutes(eventService));
app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3000);
attachSignaling(server);
server.listen(port, () => {
  console.log(`VoiceShield backend listening on port ${port}`);
});