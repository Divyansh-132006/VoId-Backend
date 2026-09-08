import { Router } from 'express';
import { createCallController } from '../controllers/callController';
import { CallService } from '../services/callService';

export function createCallRoutes(service: CallService): Router {
  const router = Router();
  const controller = createCallController(service);
  router.post('/', controller.create);
  router.get('/:callId', controller.get);
  router.post('/:callId/join', controller.join);
  router.post('/:callId/end', controller.end);
  return router;
}