import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Mail, Lock, User, ArrowRight, Shield, UserCircle } from "lucide-react";
import { useState } from "react";
import RippleButton from "@/components/RippleButton";
import AnimatedStatus from "@/components/AnimatedSuccess";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useNavigate } from "react-router-dom";
import { authService } from "@/api";
import { toast } from "sonner";

export default function Register() {
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"user" | "admin">("user");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement)?.value;

    const newErrors: Record<string, boolean> = {};
    if (!firstName) newErrors.firstName = true;
    if (!email) newErrors.email = true;
    if (!password) newErrors.password = true;

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setLoading(false);
      setTimeout(() => setErrors({}), 2000);
      return;
    }

    try {
      // Backend accepts 'email' and 'password'. 'name' is optional but good to send.
      const response = await authService.register({
        email,
        password,
        name: firstName,
        role
      });

      if (response.success) {
        setSuccess(true);
        toast.success("Account created successfully!");
        // Small delay to show success animation then redirect to login
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
      <div className="orb w-96 h-96 top-10 right-0 bg-secondary" />
      <div className="orb w-72 h-72 bottom-10 -left-10 bg-primary" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md glass-strong rounded-3xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <motion.div whileHover={{ rotate: 10 }} className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Ticket size={20} className="text-primary-foreground" />
            </motion.div>
          </Link>
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground">Start creating amazing events today</p>
        </div>

        <AnimatePresence>
          <AnimatedStatus variant="success" title="Account created!" description="Welcome to EventHub." show={success} />
        </AnimatePresence>

        <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">First name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input name="firstName" type="text" placeholder="John" className={`input-glass pl-10 ${errors.firstName ? "input-error animate-shake" : ""}`} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Last name</label>
              <input type="text" placeholder="Doe" className="input-glass" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input name="email" type="email" placeholder="you@example.com" className={`input-glass pl-10 ${errors.email ? "input-error animate-shake" : ""}`} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input name="password" type="password" placeholder="••••••••" className={`input-glass pl-10 ${errors.password ? "input-error animate-shake" : ""}`} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Role</label>
            <div className={`relative ${errors.role ? "animate-shake" : ""}`}>
              <UserCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
              <Select value={role} onValueChange={(val: "user" | "admin") => setRole(val)}>
                <SelectTrigger className={`input-glass pl-10 border-none h-auto py-3 ring-0 focus:ring-0 focus:ring-offset-0 ${errors.role ? "input-error" : ""}`}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-border/60">
                  <SelectItem value="user" className="focus:bg-primary/20 focus:text-primary">
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      <span>User</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin" className="focus:bg-secondary/20 focus:text-secondary">
                    <div className="flex items-center gap-2">
                      <Shield size={14} />
                      <span>Admin</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <RippleButton
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>Create Account <ArrowRight size={16} /></>
            )}
          </RippleButton>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div >
  );
}
