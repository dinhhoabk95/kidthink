import { setupCronJobs } from "./cron.js";
import { startWorker } from "./worker.js";

startWorker();
setupCronJobs();
console.log("Worker started");
