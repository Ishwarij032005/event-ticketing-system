import { motion } from "framer-motion";
import { Calendar, Ticket, DollarSign, Users, Link2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/api/services/admin.service";
import { APIResponse, EventStats, SystemStats } from "@/api/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import StatsCard from "@/components/StatsCard";
import { StatsCardSkeleton, TableSkeleton } from "@/components/LoadingSkeletons";

const tooltipStyle = {
  background: "hsl(225 25% 10%)",
  border: "1px solid hsl(225 15% 20%)",
  borderRadius: "12px",
  fontSize: "12px",
};

export default function AdminDashboard() {
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

  // Build chart data from event stats or fallback to empty
  const chartData = eventStats.slice(0, 6).map((e) => ({
    name: e.title.slice(0, 10),
    bookings: e.total_bookings,
    revenue: e.revenue,
  }));

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mb-8">Overview of your events and performance</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <StatsCardSkeleton />
            </motion.div>
          ))
        ) : (
          <>
            <StatsCard label="Total Bookings" value={String(summary?.total_registrations ?? 0)} change="across all events" trend="up" icon={Calendar} delay={0} />
            <StatsCard label="Occupancy" value={`${(summary?.occupancy_percentage ?? 0).toFixed(1)}%`} change="total capacity filled" trend="up" icon={Ticket} gradient="gradient-secondary" delay={0.1} />
            <StatsCard label="Total Revenue" value={`$${((eventStats.reduce((a, e) => a + e.revenue, 0)) / 1000).toFixed(1)}K`} change="gross revenue" trend="up" icon={DollarSign} delay={0.2} />
            <StatsCard label="Cancellation" value={`${(summary?.cancellation_rate ?? 0).toFixed(1)}%`} change="rate of cancellations" trend="down" icon={Users} delay={0.3} />
          </>
        )}
      </div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass rounded-2xl p-6 mb-8">
        <h2 className="font-bold text-lg mb-6">Revenue & Bookings per Event</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData.length ? chartData : [{ name: "No data", bookings: 0, revenue: 0 }]}>
            <defs>
              <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(33 100% 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(33 100% 55%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(215 80% 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(215 80% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 20%)" />
            <XAxis dataKey="name" stroke="hsl(215 15% 55%)" fontSize={12} />
            <YAxis stroke="hsl(215 15% 55%)" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="bookings" stroke="hsl(33 100% 55%)" fill="url(#colorBookings)" strokeWidth={2} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(215 80% 55%)" fill="url(#colorRevenue)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Events Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg">Events Performance</h2>
          <Link to="/admin/events/create" className="btn-primary !py-1.5 text-sm">Create Event</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                {["Event", "Bookings", "Revenue", "Remaining"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={4} cols={4} />
              ) : eventStats.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No events found</td></tr>
              ) : (
                eventStats.map((evt, i) => (
                  <motion.tr key={evt.event_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-4 text-sm font-medium">
                      <Link to={`/events/${evt.event_id}`} className="hover:text-primary transition-colors flex items-center gap-1">
                        {evt.title} <Link2 size={12} />
                      </Link>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{evt.total_bookings}</td>
                    <td className="py-4 text-sm font-medium">${evt.revenue.toLocaleString()}</td>
                    <td className="py-4 text-sm text-muted-foreground">{evt.tickets_remaining}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
