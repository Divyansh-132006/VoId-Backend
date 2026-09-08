import { DashboardRepository } from '../db/dashboardRepository';
import { DashboardData } from '../types/dashboard';

export class DashboardService {
  constructor(private readonly dashboard: DashboardRepository) {}

  getData(): DashboardData {
    return {
      calls: this.dashboard.listCalls(),
      events: this.dashboard.listEvents(),
      challengeEvents: this.dashboard.listChallengeEvents()
    };
  }
}