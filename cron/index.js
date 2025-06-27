import cron from "node-cron";
import { expireOldPlans } from "./expireOldPlans.js";

// Every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("[Cron] Running expireOldPlans...");
  await expireOldPlans();
});
