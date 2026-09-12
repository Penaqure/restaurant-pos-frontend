import axiosInstance from "@/lib/axiosInstance";

export type ReportSummary = {
  today: { sales: number; orders: number };
  dailySales: { date: string; sales: number; orders: number }[];
  paymentMethods: { method: string; amount: number }[];
};

export async function getSummary(days = 7) {
  const { data } = await axiosInstance.get<ReportSummary>("/reports/summary", { params: { days } });
  return data;
}

export type Analytics = {
  range: { since: string; days: number };
  overview: {
    sales: number;
    orders: number;
    avgOrderValue: number;
    taxCollected: number;
    discountGiven: number;
    cancelledOrders: number;
    totalOrdersPlaced: number;
  };
  dailySales: { date: string; sales: number; orders: number }[];
  paymentMethods: { method: string; amount: number }[];
  orderTypes: { type: string; orders: number; sales: number }[];
  topItems: { menuItemId: string; name: string; quantity: number; revenue: number }[];
  categorySales: { categoryId: string; name: string; quantity: number; revenue: number }[];
  peakHours: { hour: number; orders: number; sales: number }[];
  discounts: { code: string; timesUsed: number; totalDiscount: number }[];
  branchSales: { branchId: string; branchName: string; orders: number; sales: number }[];
  staffPerformance: { userId: string; name: string; orders: number; sales: number }[];
};

export async function getAnalytics(days = 30) {
  const { data } = await axiosInstance.get<Analytics>("/reports/analytics", { params: { days } });
  return data;
}

export type MyActivity = {
  range: { since: string; days: number };
  ordersCreated: {
    today: { orders: number; sales: number };
    dailyTrend: { date: string; orders: number; sales: number }[];
    orderTypes: { type: string; orders: number }[];
  };
  billsGenerated: {
    today: { orders: number; sales: number };
    dailyTrend: { date: string; orders: number; sales: number }[];
    paymentMethods: { method: string; amount: number }[];
  };
};

export async function getMyActivity(days = 7) {
  const { data } = await axiosInstance.get<MyActivity>("/reports/my-activity", { params: { days } });
  return data;
}
