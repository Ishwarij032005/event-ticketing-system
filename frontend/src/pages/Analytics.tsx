import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import StatsCard from "@/components/StatsCard";
import { StatsCardSkeleton } from "@/components/LoadingSkeletons";
import { TrendingUp, Ticket, Users, DollarSign } from "lucide-react";
import { adminService } from "@/api";

const COLORS = ["hsl(33 100% 55%)", "hsl(215 80% 55%)", "hsl(270 60% 60%)", "hsl(160 70% 45%)", "hsl(0 85% 60%)"];

const tooltipStyle = {
  background: "hsl(225 25% 10%)",
  border: "1px solid hsl(225 15% 20%)",
  borderRadius: "12px",
  fontSize: "12px",
};

export default function Analytics() {
  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ["admin-stats-summary"],
    queryFn: () => adminService.getAnalyticsSummary(),
  });

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminService.getAnalytics(),
  });

  const summary = summaryRes?.data;
  const eventStats = statsRes?.data ?? [];
  const isLoading = summaryLoading || statsLoading;

  // Revenue trend from events list (tickets sold & revenue per event)
  const revenueData = eventStats.slice(0, 6).map((e) => ({
    month: e.title.slice(0, 12),
    revenue: e.revenue,
    tickets: e.total_bookings,
  }));

  // Category breakdown derived from event list
  const categoryMap: Record<string, number> = {};
  eventStats.forEach((e) => {
    const cat = e.category || "General";
    categoryMap[cat] = (categoryMap[cat] ?? 0) + 1;
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold mb-1">Analytics</h1>
        <p className="text-muted-foreground text-sm mb-8">Deep dive into your event performance</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)
        ) : (
          <>
            <StatsCard label="Total Events" value={String(eventStats.length)} change="all events" trend="up" icon={TrendingUp} delay={0} />
            <StatsCard label="Tickets Sold" value={String(summary?.total_registrations ?? 0)} change="registrations" trend="up" icon={Ticket} gradient="gradient-secondary" delay={0.1} />
            <StatsCard label="Occupancy" value={`${(summary?.occupancy_percentage ?? 0).toFixed(1)}%`} change="total capacity" trend="up" icon={Users} delay={0.2} />
            <StatsCard label="Total Revenue" value={`$${((eventStats.reduce((a, e) => a + e.revenue, 0)) / 1000).toFixed(1)}K`} change="gross" trend="up" icon={DollarSign} delay={0.3} />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-6">Revenue by Event</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData.length ? revenueData : [{ month: "No data", revenue: 0, tickets: 0 }]}>
              <defs>
                <linearGradient id="aRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(33 100% 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(33 100% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 20%)" />
              <XAxis dataKey="month" stroke="hsl(215 15% 55%)" fontSize={11} />
              <YAxis stroke="hsl(215 15% 55%)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(33 100% 55%)" fill="url(#aRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Tickets Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="glass rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-6">Tickets Sold per Event</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData.length ? revenueData : [{ month: "No data", tickets: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 20%)" />
              <XAxis dataKey="month" stroke="hsl(215 15% 55%)" fontSize={11} />
              <YAxis stroke="hsl(215 15% 55%)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="tickets" fill="hsl(215 80% 55%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Category Pie */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="glass rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-6">Events by Category</h2>
        {categoryData.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No category data available</p>
        ) : (
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={110} innerRadius={60} paddingAngle={4} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </div>
  );
}
