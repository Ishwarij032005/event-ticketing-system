import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email });
      setSent(true);
      toast.success("Reset link sent!", { description: "Check your inbox for the password reset link." });
    } catch (err: any) {
      const msg = err?.message ?? "Something went wrong. Please try again.";
      setError(msg);
      toast.error("Failed to send reset link", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
      <div className="orb w-80 h-80 top-20 left-10 bg-accent" />
      <div className="orb w-64 h-64 bottom-20 right-10 bg-primary" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md glass-strong rounded-3xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Ticket size={20} className="text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold mb-1">Reset password</h1>
          <p className="text-sm text-muted-foreground">We'll send you a link to reset your password</p>
        </div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <CheckCircle size={48} className="mx-auto text-emerald-400 mb-4" />
              <h2 className="font-semibold mb-2">Check your email</h2>
              <p className="text-sm text-muted-foreground mb-6">We sent a password reset link to <strong>{email}</strong></p>
              <button onClick={() => navigate("/login")} className="btn-primary w-full">Back to Sign In</button>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`input-glass pl-10 ${error ? "input-error" : ""}`}
                  />
                </div>
                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-destructive mt-1.5">
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-6">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>Send Reset Link <ArrowRight size={16} /></>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6 transition-colors">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </motion.div>
    </div>
  );
}
