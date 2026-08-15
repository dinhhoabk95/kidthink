import { defineEventHandler } from "h3";
import auditLogsHandler from "./audit-logs/index.get.js";

export default defineEventHandler((event) => auditLogsHandler(event));
