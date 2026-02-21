import { useState, memo } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, Ticket, User, BarChart3,
  Users, PlusCircle, Bell, Search, Menu, X, LogOut, ChevronDown, Shield,
} from "lucide-react";
import NotificationsPanel from "@/components/NotificationsPanel";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const userNav = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Events", path: "/events", icon: Calendar },
  { label: "My Tickets", path: "/dashboard/tickets", icon: Ticket },
  { label: "Profile", path: "/dashboard/profile", icon: User },
];

const adminNav = [
  { label: "Overview", path: "/admin", icon: BarChart3 },
  { label: "Create Event", path: "/admin/events/create", icon: PlusCircle },
  { label: "Attendees", path: "/admin/attendees", icon: Users },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    queryClient.clear(); // wipe all cached server state
    toast.success("Signed out successfully");
    navigate("/login", { replace: true });
  };

  // Derive avatar initials from email
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";

  // Display name: everything before the @ in the email
  const displayName = user?.email?.split("@")[0] ?? "User";

  const NavItem = memo(({ item }: { item: typeof userNav[0] }) => {
    const active = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
          ${active
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
      >
        {active && (
          <motion.div
            layoutId="nav-active"
            className="absolute inset-0 bg-primary/10 rounded-xl"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
        <item.icon size={18} className={`relative z-10 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
        {sidebarOpen && <span className="relative z-10">{item.label}</span>}
      </Link>
    );
  });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-0 left-0 h-full z-40 glass-strong flex flex-col"
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50">
          <motion.div
            whileHover={{ rotate: 10 }}
            className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0"
          >
            <Ticket size={16} className="text-primary-foreground" />
          </motion.div>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bold text-lg tracking-tight"
            >
              EventHub
            </motion.span>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-2 mt-2">
            {sidebarOpen ? "Main" : "•"}
          </p>
          {userNav.map((item) => <NavItem key={item.path} item={item} />)}

          {/* Admin section — only visible to admins */}
          {isAdmin && (
            <>
              <div className="my-4 border-t border-border/30" />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-2">
                {sidebarOpen ? "Admin" : "•"}
              </p>
              {adminNav.map((item) => <NavItem key={item.path} item={item} />)}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-border/50">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? 260 : 72 }}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 glass-strong flex items-center justify-between px-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn-ghost p-2"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </motion.button>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search events, tickets..."
                className="input-glass pl-10 py-2 text-sm w-72"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setNotifOpen(!notifOpen)}
                className="btn-ghost p-2 relative"
              >
                <Bell size={18} />
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-2 h-2 rounded-full gradient-primary"
                />
              </motion.button>
              <AnimatePresence>
                {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
              </AnimatePresence>
            </div>

            <Link to="/dashboard/profile" className="flex items-center gap-2 btn-ghost">
              <div className="w-8 h-8 rounded-full gradient-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
                {initials}
              </div>
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-sm font-medium capitalize">{displayName}</span>
                {user?.role === 'admin' ? (
                  <span className="badge-primary text-[10px] py-0 px-1.5 h-4 flex items-center gap-1 group-hover:scale-105 transition-transform">
                    <Shield size={10} />
                    Admin
                  </span>
                ) : (
                  <span className="badge-info text-[10px] py-0 px-1.5 h-4 flex items-center gap-1 group-hover:scale-105 transition-transform">
                    <User size={10} />
                    Member
                  </span>
                )}
              </div>
              <ChevronDown size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </div>
        </header>

        {/* Page Content with transition */}
        <main className="flex-1 p-6">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
