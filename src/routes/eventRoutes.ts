import { Router } from 'express';
import { createEventController } from '../controllers/eventController';
import { EventService } from '../services/eventService';

export function createEventRoutes(service: EventService): Router {
  const router = Router();
  router.post('/', createEventController(service).create);
  return router;
}