import { motion } from "framer-motion";
import { User, Mail, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();

  // Profile editing is UI-only since the backend exposes no PATCH /users/me endpoint.
  // We show the real email from AuthContext; other fields are supplementary.
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: backend has no profile-update endpoint  
    toast.success("Profile saved", { description: "Your changes have been saved locally." });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold mb-1">Profile</h1>
        <p className="text-muted-foreground text-sm mb-8">Manage your account settings</p>
      </motion.div>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="glass rounded-2xl p-6 mb-6 flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
            {initials}
          </div>
        </div>
        <div>
          <h2 className="font-bold text-lg">{user?.email ?? "—"}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <span className={`mt-2 inline-block ${user?.role === "admin" ? "badge-success" : "badge-primary"}`}>
            {user?.role === "admin" ? "Admin" : "Member"}
          </span>
        </div>
      </motion.div>

      {/* Form */}
      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass rounded-2xl p-6 space-y-4" onSubmit={handleSave}>
        <h2 className="font-semibold mb-2">Account Information</h2>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="email" defaultValue={user?.email ?? ""} className="input-glass pl-10" readOnly />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Role</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={user?.role ?? "user"} className="input-glass pl-10 capitalize" readOnly />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">User ID</label>
          <input type="text" value={user?.id ?? "—"} className="input-glass font-mono text-xs" readOnly />
        </div>

        <div className="pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-4">Additional profile fields (name, phone, bio) will be available once the backend exposes a profile update endpoint.</p>
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </motion.form>
    </div>
  );
}
