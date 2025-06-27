import Plan from "../models/Plan.js";

export const expireOldPlans = async () => {
  try {
    const now = new Date();

    const result = await Plan.updateMany(
      {
        endDate: { $lt: now },
        status: { $ne: "expired" },
      },
      { $set: { status: "expired" } }
    );

    console.log(`[Cron] ✅ Expired plans updated: ${result.modifiedCount}`);
  } catch (error) {
    console.error("[Cron] ❌ Error updating expired plans:", error);
  }
};
