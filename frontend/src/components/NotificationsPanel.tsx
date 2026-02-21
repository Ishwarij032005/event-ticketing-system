import { motion } from "framer-motion";
import { Bell, Calendar, Ticket, CheckCircle } from "lucide-react";

const notifications = [
  { id: 1, icon: Calendar, title: "New event published", desc: "Tech Summit 2025 is now live", time: "2m ago", unread: true },
  { id: 2, icon: Ticket, title: "Ticket confirmed", desc: "Your ticket for Design Conf is ready", time: "1h ago", unread: true },
  { id: 3, icon: CheckCircle, title: "Event reminder", desc: "Startup Pitch Night starts in 2 hours", time: "2h ago", unread: false },
  { id: 4, icon: Bell, title: "Price drop alert", desc: "Early bird pricing ends tomorrow", time: "5h ago", unread: false },
];

export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 top-12 w-80 glass-strong rounded-2xl overflow-hidden shadow-2xl"
    >
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Notifications</h3>
        <span className="badge-primary">4 new</span>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((n) => (
          <div key={n.id} className={`flex items-start gap-3 p-4 border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer ${n.unread ? "bg-primary/5" : ""}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.unread ? "gradient-primary" : "bg-muted"}`}>
              <n.icon size={14} className={n.unread ? "text-primary-foreground" : "text-muted-foreground"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{n.title}</p>
              <p className="text-xs text-muted-foreground truncate">{n.desc}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
            </div>
            {n.unread && <span className="w-2 h-2 rounded-full gradient-primary mt-2 shrink-0" />}
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border/50">
        <button onClick={onClose} className="w-full text-xs text-center text-primary hover:text-primary/80 font-medium transition-colors">
          View all notifications
        </button>
      </div>
    </motion.div>
  );
}
