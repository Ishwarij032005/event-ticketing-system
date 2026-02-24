import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";

interface EventCardProps {
  id: string;
  title: string;
  start_time: string;
  location?: string;
  remaining_tickets: number;
  price: number;
  category: string;
  gradient?: string;
  image?: string;
}

export default function EventCard({
  id,
  title,
  start_time,
  location = "Online",
  remaining_tickets,
  price,
  category,
  gradient = "bg-gradient-to-br from-blue-600 to-purple-700",
  image
}: EventCardProps) {
  const formattedDate = new Date(start_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/events/${id}`} className="block glass rounded-2xl overflow-hidden card-elevate group">
        {/* Event Image */}
        <div className="h-44 relative overflow-hidden">
          {image ? (
            <img
              src={image.startsWith('http') ? image : `http://localhost:8081${image}`}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className={`w-full h-full ${gradient}`} />
          )}
          <motion.div
            className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          <div className="absolute top-3 left-3">
            <span className="badge-primary backdrop-blur-sm">{category}</span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="glass-subtle rounded-full px-3 py-1 text-xs font-bold text-foreground backdrop-blur-sm">
              ${price}
            </span>
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-bold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-1">{title}</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-primary" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-secondary" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-accent" />
              <span>{remaining_tickets} tickets left</span>
            </div>
          </div>

          <div className="mt-4 flex items-center text-sm font-medium text-primary gap-1 group-hover:gap-2 transition-all">
            View details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
