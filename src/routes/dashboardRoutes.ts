import { Router } from 'express';
import { createDashboardController } from '../controllers/dashboardController';
import { DashboardService } from '../services/dashboardService';

export function createDashboardRoutes(service: DashboardService): Router {
  const router = Router();
  router.get('/', createDashboardController(service).get);
  return router;
}