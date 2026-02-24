import { useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, Heart, CheckCircle, ArrowRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { eventsService, registrationsService } from "@/api";
import { Event, TicketType } from "@/api/types";

export default function EventDetails() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: eventResponse, isLoading: eventLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => eventsService.get(id!),
  });

  const { data: seatsResponse } = useQuery({
    queryKey: ["event-seats", id],
    queryFn: () => eventsService.getSeats(id!),
  });

  const [isBooked, setIsBooked] = useState(false);

  const buyTicketMutation = useMutation({
    mutationFn: (ticketTypeId: string) =>
      registrationsService.create({ event_id: id!, ticket_type_id: ticketTypeId !== 'default' ? ticketTypeId : undefined }),
    onSuccess: () => {
      setIsBooked(true);
      toast.success("Ticket booked successfully!");
      queryClient.invalidateQueries({ queryKey: ["event-seats", id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to book ticket");
    }
  });

  const handleBuyTicket = useCallback((ticketTypeId: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to book tickets");
      return;
    }
    buyTicketMutation.mutate(ticketTypeId);
  }, [isAuthenticated, buyTicketMutation]);

  const event = eventResponse?.data;
  const isLoading = eventLoading;

  const displayTicketTypes = useMemo(() => {
    if (!event) return [];
    return event.ticket_types || [
      { id: 'default', name: 'General Admission', price: event.price, capacity: event.total_tickets, remaining_tickets: event.remaining_tickets } as TicketType
    ];
  }, [event]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) return <div className="pt-20 text-center">Event not found</div>;

  const formattedDate = new Date(event.start_time).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = new Date(event.start_time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen pt-20 px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        <Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to events
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Hero Image */}
          <div className="h-64 md:h-80 rounded-3xl relative overflow-hidden mb-8">
            {event.image_url ? (
              <img
                src={event.image_url.startsWith('http') ? event.image_url : `http://localhost:8081${event.image_url}`}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <span className="badge-primary mb-3 inline-block">{event.category}</span>
                <h1 className="text-3xl md:text-4xl font-bold">{event.title}</h1>
              </div>
              <div className="flex gap-2">
                <button className="btn-glass !p-3 !rounded-full"><Heart size={18} /></button>
                <button className="btn-glass !p-3 !rounded-full"><Share2 size={18} /></button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Details */}
            <div className="md:col-span-2 space-y-6">
              <div className="glass rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-4">Event Details</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Calendar size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-medium">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <Clock size={18} className="text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm font-medium">{formattedTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                      <MapPin size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">{event.location || "Online"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Users size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Availability</p>
                      <p className="text-sm font-medium">{seatsResponse?.data?.remaining_seats || event.remaining_tickets} / {event.total_tickets}</p>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold mb-2">About This Event</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {event.description || "No description provided."}
                </p>
              </div>
            </div>

            {/* Tickets */}
            <div className="space-y-4">
              <h2 className="font-bold text-lg">Select Ticket</h2>
              {isBooked ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-2xl p-8 text-center space-y-4 border-emerald-500/50"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Booking Confirmed!</h3>
                    <p className="text-sm text-muted-foreground mt-1">Your spot is reserved. We've sent the details to your email.</p>
                  </div>
                  <div className="pt-4 space-y-3">
                    <Link to="/dashboard/tickets" className="btn-primary w-full flex items-center justify-center gap-2">
                      View My Tickets <ArrowRight size={16} />
                    </Link>
                    <button
                      onClick={() => setIsBooked(false)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Book another ticket
                    </button>
                  </div>
                </motion.div>
              ) : (
                displayTicketTypes.map((t: TicketType) => (
                  <div key={t.id} className={`glass rounded-2xl p-5 ${t.remaining_tickets === 0 ? "opacity-50" : "card-hover"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">{t.name}</h3>
                      <span className="text-lg font-bold gradient-text">${t.price}</span>
                    </div>
                    <ul className="space-y-1.5 mb-4">
                      <li className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle size={12} className="text-primary shrink-0" /> Full event access
                      </li>
                      <li className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle size={12} className="text-primary shrink-0" /> {t.remaining_tickets} tickets remaining
                      </li>
                    </ul>
                    <button
                      disabled={t.remaining_tickets === 0 || buyTicketMutation.isPending}
                      onClick={() => handleBuyTicket(t.id)}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center ${t.remaining_tickets > 0 ? "btn-primary" : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                    >
                      {buyTicketMutation.isPending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        t.remaining_tickets > 0 ? "Buy Ticket" : "Sold Out"
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
