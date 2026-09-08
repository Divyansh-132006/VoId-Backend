import { Router } from 'express';
import { createChallengeController } from '../controllers/challengeController';
import { ChallengeService } from '../services/challengeService';

export function createChallengeRoutes(service: ChallengeService): Router {
  const router = Router();
  const controller = createChallengeController(service);
  router.get('/random', controller.random);
  router.get('/:challengeId', controller.get);
  return router;
}