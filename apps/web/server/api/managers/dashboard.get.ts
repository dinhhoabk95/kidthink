import { defineEventHandler } from "h3";
import {
  type DashboardApiResponse,
  getManagerDashboard,
} from "#server/services/dashboard-service";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(
  async (event): Promise<DashboardApiResponse> => {
    const manager = requireManagerSession(event);
    return await getManagerDashboard(manager.role);
  }
);
