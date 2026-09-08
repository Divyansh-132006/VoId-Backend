import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';

export function createDashboardController(service: DashboardService) {
  return {
    get: (_request: Request, response: Response) => {
      response.json(service.getData());
    }
  };
}