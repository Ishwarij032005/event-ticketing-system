import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Mail, Lock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import RippleButton from "@/components/RippleButton";
import AnimatedStatus from "@/components/AnimatedSuccess";
import { useAuth, User } from "@/context/AuthContext";
import { authService } from "@/api";
import { toast } from "sonner";

export default function Login() {
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedInRole, setLoggedInRole] = useState<"admin" | "user" | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Show session-expired toast when redirected here after a 401
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('session') === 'expired') {
      toast.warning('Session expired', { description: 'Please sign in again to continue.' });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;

    const newErrors: Record<string, boolean> = {};
    if (!email) newErrors.email = true;
    if (!password) newErrors.password = true;

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setLoading(false);
      setTimeout(() => setErrors({}), 2000);
      return;
    }

    try {
      const response = await authService.login({ email, password });

      if (response?.success && response.data) {
        const token = response.data.token;
        // Basic JWT decode to extract user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user: User = {
          id: payload.user_id || payload.sub,
          email: email,
          role: payload.role as 'admin' | 'user'
        };

        login(token, user);
        setLoggedInRole(user.role);
        setSuccess(true);
        toast.success("Welcome back!");

        // Redirect logic
        const destination = user.role === 'admin' ? '/admin' : '/dashboard';
        const from = (location.state as any)?.from?.pathname ?? destination;

        setTimeout(() => navigate(from, { replace: true }), 1500);
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
      setErrors({ auth: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
      <div className="orb w-96 h-96 top-10 -left-20 bg-primary" />
      <div className="orb w-72 h-72 bottom-10 right-0 bg-secondary" />

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
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your EventHub account</p>
        </div>

        <AnimatePresence>
          <AnimatedStatus
            variant="success"
            title="Login successful!"
            description={loggedInRole === 'admin' ? "Redirecting to Admin Dashboard..." : "Redirecting to Dashboard..."}
            show={success}
          />
        </AnimatePresence>

        <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input name="email" type="email" placeholder="you@example.com" className={`input-glass pl-10 ${errors.email ? "input-error animate-shake" : ""}`} />
            </div>
            <AnimatePresence>
              {errors.email && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-destructive mt-1">Email is required</motion.p>
              )}
            </AnimatePresence>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input name="password" type="password" placeholder="••••••••" className={`input-glass pl-10 ${errors.password ? "input-error animate-shake" : ""}`} />
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-destructive mt-1">Password is required</motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" className="rounded border-border" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-primary hover:text-primary/80 transition-colors">
              Forgot password?
            </Link>
          </div>

          <RippleButton
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>Sign In <ArrowRight size={16} /></>
            )}
          </RippleButton>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
