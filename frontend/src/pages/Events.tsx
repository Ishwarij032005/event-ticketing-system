import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { eventsService } from "@/api";
import { EventCardSkeleton } from "@/components/LoadingSkeletons";
import EventCard from "@/components/EventCard";
import EmptyState from "@/components/EmptyState";

const categories = ["All", "Tech", "Music", "Business", "Design", "Sports"];

export default function Events() {
  const [active, setActive] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 6;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to first page when category changes
  useEffect(() => {
    setPage(1);
  }, [active]);

  const { data: eventsResponse, isLoading } = useQuery({
    queryKey: ["events", active, debouncedSearch, page],
    queryFn: () => eventsService.list({
      limit,
      page,
      category: active !== "All" ? active : undefined,
      q: debouncedSearch || undefined,
    }),
  });

  const filtered = useMemo(() => eventsResponse?.data || [], [eventsResponse]);
  const meta = eventsResponse?.meta;
  const totalPages = meta?.total_pages || 1;

  return (
    <div className="min-h-screen pt-20 px-6 pb-12">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Discover Events</h1>
          <p className="text-muted-foreground mb-8">Find your next unforgettable experience</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="input-glass pl-10 py-2.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal size={16} className="text-muted-foreground" />
            {categories.map((c) => (
              <motion.button
                key={c}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActive(c)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 relative ${active === c ? "text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
                  }`}
              >
                {active === c && (
                  <motion.div
                    layoutId="filter-active"
                    className="absolute inset-0 gradient-primary rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{c}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: limit }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <EventCardSkeleton />
              </motion.div>
            ))
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((event, i) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <EventCard
                    id={event.id}
                    title={event.title}
                    start_time={event.start_time}
                    remaining_tickets={event.remaining_tickets}
                    price={event.price}
                    category={event.category}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={Inbox}
            title="No events found"
            description="Try adjusting your filters or search terms"
            actionLabel="View All Events"
            actionPath="/events"
          />
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <motion.button
                  key={p}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${p === page ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {p}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
