import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";  
    

// choose the business timezone you want your "day" to follow
const BIZ_TZ = "Africa/Casablanca"; // change if needed
const PAID_STATUS = "paid"; // adjust if you use different status values for paid orders 

// ================= GET ANALYTICS DATA =================

export const getAnalyticsData = async () => {
  // If you don't need filters, estimatedDocumentCount is faster
  const [totalUsers, totalProducts, salesAgg] = await Promise.all([
    User.estimatedDocumentCount(),
    Product.estimatedDocumentCount(),
    Order.aggregate([
      { $match: { status: PAID_STATUS } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }, // prefer minor units (int)
        },
      },
    ]),
  ]);

  const { totalSales = 0, totalRevenue = 0 } = salesAgg[0] || {};
  return { users: totalUsers, products: totalProducts, totalSales, totalRevenue };
};

// Utility to get [start, endExclusive) in local business tz.
// If you already pass Date objects with proper times, you can skip this.
function nextDay(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}

export const getDailySalesData = async (startDate, endDate) => {
  try {
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      throw new Error("startDate and endDate must be Date objects");
    }

    // use [startDate, endExclusive) to avoid end-of-day edge cases
    const endExclusive = nextDay(endDate);

    const dailySalesData = await Order.aggregate([
      {
        $match: {
          status: PAID_STATUS,
          createdAt: { $gte: startDate, $lt: endExclusive },
        },
      },
      // Truncate to day in your business timezone
      {
        $addFields: {
          day: { $dateTrunc: { date: "$createdAt", unit: "day", timezone: BIZ_TZ } },
        },
      },
      {
        $group: {
          _id: "$day",
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }, // prefer minor units
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build a fast lookup map: ISO date (YYYY-MM-DD) -> { sales, revenue }
    const aggMap = new Map(
      dailySalesData.map((d) => [
        d._id.toISOString().slice(0, 10), // day is at 00:00 UTC; aligns with BIZ_TZ truncation
        { sales: d.sales, revenue: d.revenue },
      ])
    );

    const dateArray = getDatesInRange(startDate, endDate); // YYYY-MM-DD strings (UTC)
    return dateArray.map((date) => {
      const v = aggMap.get(date);
      return { date, sales: v?.sales ?? 0, revenue: v?.revenue ?? 0 };
    });
  } catch (error) {
    throw error;
  }
};

// Generates ['YYYY-MM-DD', ...] inclusive of both endpoints, in UTC.
// If you want local tz labels, generate from a tz-aware library like date-fns-tz or luxon.
function getDatesInRange(startDate, endDate) {
  const dates = [];
  const cur = new Date(Date.UTC(
    startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()
  ));
  const last = new Date(Date.UTC(
    endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()
  ));

  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

