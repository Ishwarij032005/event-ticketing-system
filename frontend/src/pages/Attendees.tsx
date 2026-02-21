import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Download, Filter, MoreHorizontal, Mail, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, APIResponse } from "@/api/client";
import { TableSkeleton } from "@/components/LoadingSkeletons";
import RippleButton from "@/components/RippleButton";
import EmptyState from "@/components/EmptyState";

interface Attendee {
  id: string;
  email: string;
  role: string;
}

export default function Attendees() {
  const { id: eventId } = useParams<{ id: string }>();
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery({
    queryKey: ["attendees", eventId],
    queryFn: () => apiClient.get<APIResponse<Attendee[]>>(`/admin/events/${eventId}/attendees`),
    enabled: !!eventId,
  });

  const attendees = response?.data ?? [];
  const filtered = attendees.filter(
    (a) => a.email.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (email: string) => email.slice(0, 2).toUpperCase();

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold mb-1">Attendees</h1>
        <p className="text-muted-foreground text-sm mb-8">Manage event registrations and attendees</p>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attendees..."
            className="input-glass pl-10 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <RippleButton className="btn-glass !py-2 text-sm flex items-center gap-2"><Filter size={14} /> Filter</RippleButton>
          <RippleButton className="btn-glass !py-2 text-sm flex items-center gap-2"><Download size={14} /> Export</RippleButton>
          <RippleButton className="btn-glass !py-2 text-sm flex items-center gap-2"><Mail size={14} /> Email All</RippleButton>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                {["Attendee", "Role", "Status"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground p-4 uppercase tracking-wider">{h}</th>
                ))}
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={6} cols={4} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState icon={Users} title="No attendees found" description={search ? "Try a different search" : "No confirmed attendees yet"} />
                  </td>
                </tr>
              ) : (
                filtered.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
                          {initials(a.email)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{a.email}</p>
                          <p className="text-xs text-muted-foreground font-mono">{a.id?.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><span className="badge-primary capitalize">{a.role}</span></td>
                    <td className="p-4"><span className="badge-success">Confirmed</span></td>
                    <td className="p-4">
                      <button className="btn-ghost !p-1.5"><MoreHorizontal size={16} /></button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of {attendees.length} attendees</p>
        </div>
      </motion.div>
    </div>
  );
}
