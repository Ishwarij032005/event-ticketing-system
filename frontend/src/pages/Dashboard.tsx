import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Ticket, Clock, MapPin, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { registrationsService } from "@/api";
import { useAuth } from "@/context/AuthContext";
import StatsCard from "@/components/StatsCard";
import { StatsCardSkeleton, TicketSkeleton } from "@/components/LoadingSkeletons";
import EmptyState from "@/components/EmptyState";

const gradients = [
  "bg-gradient-to-br from-blue-600 to-purple-700",
  "bg-gradient-to-br from-pink-600 to-rose-700",
  "bg-gradient-to-br from-amber-500 to-orange-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
];

function hoursUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return null;
  return Math.floor(diff / (1000 * 60 * 60));
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: response, isLoading } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => registrationsService.getMyRegistrations(),
  });

  const registrations = response?.data ?? [];
  const upcoming = registrations.filter((r) => r.status !== "cancelled");
  const nextEvent = upcoming
    .filter((r) => r.event?.start_time && new Date(r.event.start_time) > new Date())
    .sort((a, b) => new Date(a.event.start_time).getTime() - new Date(b.event.start_time).getTime())[0];

  const hoursToNext = nextEvent ? hoursUntil(nextEvent.event.start_time) : null;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold mb-1">
          Welcome back, {user?.email?.split("@")[0] ?? "there"} 👋
        </h1>
        <p className="text-muted-foreground text-sm mb-8">Here's what's happening with your events</p>
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
            <StatsCard label="Upcoming Events" value={String(upcoming.length)} change="registrations" trend="up" icon={Calendar} delay={0} />
            <StatsCard label="Active Tickets" value={String(registrations.filter((r) => r.status === "confirmed").length)} change="confirmed" trend="up" icon={Ticket} gradient="gradient-secondary" delay={0.1} />
            <StatsCard label="Hours Until Next" value={hoursToNext != null ? String(hoursToNext) : "—"} change={nextEvent?.event?.title ?? "No upcoming events"} trend="up" icon={Clock} delay={0.2} />
            <StatsCard label="Events Attended" value={String(registrations.length)} change="total bookings" trend="up" icon={MapPin} delay={0.3} />
          </>
        )}
      </div>

      {/* Upcoming Events */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg">Upcoming Events</h2>
          <Link to="/events" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <TicketSkeleton key={i} />)
          ) : upcoming.length === 0 ? (
            <EmptyState icon={Ticket} title="No upcoming events" description="Browse events and register for one" actionLabel="Explore Events" actionPath="/events" />
          ) : (
            upcoming.slice(0, 5).map((reg, i) => (
              <motion.div key={reg.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}>
                <Link to={`/events/${reg.event?.id}`} className="flex items-center gap-4 glass-subtle rounded-xl p-4 card-elevate group">
                  <motion.div whileHover={{ rotate: 3 }} className={`w-14 h-14 rounded-xl ${gradients[i % gradients.length]} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{reg.event?.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {reg.event?.start_time ? new Date(reg.event.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                      </span>
                    </div>
                  </div>
                  <span className="badge-primary">{reg.ticket_type?.name ?? "General"}</span>
                  <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
