import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Download, Loader2, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { registrationsService } from "@/api";
import { toast } from "sonner";

export default function TicketView() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Fetch the user's registrations and find the specific one by id
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => registrationsService.getMyRegistrations(),
  });

  const registration = response?.data?.find((r) => r.id === id);
  const event = registration?.event;
  const ticketType = registration?.ticket_type;
  const ticket = registration?.ticket;

  const cancelMutation = useMutation({
    mutationFn: () => registrationsService.cancel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
      toast.success("Registration cancelled", { description: "Your ticket has been cancelled." });
    },
    onError: (err: Error) => {
      toast.error("Failed to cancel", { description: err.message });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!registration || error) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-muted-foreground mb-4">Ticket not found.</p>
        <Link to="/dashboard/tickets" className="btn-primary">Back to My Tickets</Link>
      </div>
    );
  }

  const startDate = event?.start_time ? new Date(event.start_time) : null;
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const pdfUrl = ticket?.pdf_url ? `${apiUrl.replace("/api/v1", "")}${ticket.pdf_url}` : "#";
  const qrUrl = `${apiUrl}/registrations/${id}/qr`;

  return (
    <div className="max-w-lg mx-auto">
      <Link to="/dashboard/tickets" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to My Tickets
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-strong rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="h-32 bg-gradient-to-br from-blue-600 to-purple-700 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
          <div className="absolute bottom-4 left-6">
            <span className="badge-primary">{ticketType?.name ?? "General"}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold mb-1">{event?.title ?? "Event"}</h1>
            <span className={`text-xs ${registration.status === "confirmed" || registration.status === "rsvp_yes" ? "text-emerald-400" : "text-amber-400"}`}>
              Status: {registration.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <Calendar size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Date</p>
                <p className="text-sm font-medium">{startDate ? startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Clock size={16} className="text-secondary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Time</p>
                <p className="text-sm font-medium">{startDate ? startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Download size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Ticket Code</p>
                <p className="text-sm font-medium font-mono">{ticket?.ticket_code || "PENDING"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
                <span className="text-accent font-bold text-xs">$</span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Price</p>
                <p className="text-sm font-medium">{ticketType?.price != null ? `$${ticketType.price.toFixed(2)}` : "Free"}</p>
              </div>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="border-t-2 border-dashed border-border/50 relative">
            <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-background" />
            <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-background" />
          </div>

          {/* Real QR Code */}
          <div className="flex flex-col items-center py-4">
            <div className="bg-white p-4 rounded-2xl mb-4 relative min-w-[200px] min-h-[200px] flex items-center justify-center">
              {id ? (
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="w-40 h-40"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<div class="text-xs text-muted-foreground text-center">QR not available</div>');
                  }}
                />
              ) : (
                <div className="w-40 h-40 bg-muted animate-pulse rounded-lg" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">Scan at the venue for entry</p>
          </div>

          <div className="text-center py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Registration ID</p>
            <p className="text-xs font-mono text-muted-foreground/80">{id}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Download size={16} /> Download Ticket
            </a>
            {registration.status === "confirmed" && (
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="btn-glass flex items-center gap-2 text-destructive hover:bg-destructive/10"
              >
                {cancelMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><XCircle size={16} /> Cancel</>}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
