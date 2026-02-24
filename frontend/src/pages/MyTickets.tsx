import { Link } from "react-router-dom";
import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Ticket, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { registrationsService } from "@/api";
import { Registration } from "@/api/types";
import { TicketSkeleton } from "@/components/LoadingSkeletons";
import EmptyState from "@/components/EmptyState";

const gradients = [
  "bg-gradient-to-br from-blue-600 to-purple-700",
  "bg-gradient-to-br from-pink-600 to-rose-700",
  "bg-gradient-to-br from-amber-500 to-orange-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-violet-500 to-indigo-600",
];

const TicketCard = memo(({ reg, index, onCancel, isCancelling }: {
  reg: Registration,
  index: number,
  onCancel: (id: string) => void,
  isCancelling: boolean
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay: index * 0.1 }}
  >
    <div className="flex items-center gap-4 glass rounded-2xl p-5 card-elevate group">
      <motion.div
        whileHover={{ rotate: 5 }}
        className="w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative"
      >
        {reg.event?.image_url ? (
          <img
            src={reg.event.image_url.startsWith('http') ? reg.event.image_url : `http://localhost:8081${reg.event.image_url}`}
            alt={reg.event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full ${gradients[index % gradients.length]} flex items-center justify-center`}>
            <Ticket size={24} className="text-foreground/80" />
          </div>
        )}
      </motion.div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold group-hover:text-primary transition-colors">{reg.event?.title ?? "Unknown Event"}</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {reg.event?.start_time ? new Date(reg.event.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
          </span>
        </div>
      </div>
      <span className="badge-primary">{reg.ticket_type?.name ?? "General"}</span>
      <span className={reg.status === "confirmed" || reg.status === "rsvp_yes" ? "badge-success" : "badge-warning"}>
        {reg.status}
      </span>
      {reg.status === "confirmed" && (
        <button
          onClick={() => onCancel(reg.id)}
          disabled={isCancelling}
          className="text-destructive hover:text-destructive/80 transition-colors"
          title="Cancel ticket"
        >
          <XCircle size={18} />
        </button>
      )}
      <Link to={`/events/${reg.event?.id}`}>
        <ArrowRight size={16} className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all shrink-0" />
      </Link>
    </div>
  </motion.div>
));

export default function MyTickets() {
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => registrationsService.getMyRegistrations(),
  });

  const cancelMutation = useMutation({
    mutationFn: (regId: string) => registrationsService.cancel(regId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
  });

  const handleCancel = useCallback((regId: string) => {
    cancelMutation.mutate(regId);
  }, [cancelMutation]);

  const registrations = response?.data || [];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold mb-1">My Tickets</h1>
        <p className="text-muted-foreground text-sm mb-8">View and manage your event tickets</p>
      </motion.div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
              <TicketSkeleton />
            </motion.div>
          ))
        ) : registrations.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No tickets yet"
            description="Browse events and book your first ticket"
            actionLabel="Explore Events"
            actionPath="/events"
          />
        ) : (
          registrations.map((reg, i) => (
            <TicketCard
              key={reg.id}
              reg={reg}
              index={i}
              onCancel={handleCancel}
              isCancelling={cancelMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}
