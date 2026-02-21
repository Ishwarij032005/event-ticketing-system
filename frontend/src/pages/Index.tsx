import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Ticket, Calendar, Shield, Zap, BarChart3, Users, Star, Check } from "lucide-react";

const features = [
  { icon: Calendar, title: "Smart Scheduling", desc: "AI-powered event scheduling with conflict detection and optimal timing suggestions." },
  { icon: Shield, title: "Secure Ticketing", desc: "QR-based digital tickets with fraud prevention and real-time validation." },
  { icon: BarChart3, title: "Live Analytics", desc: "Real-time dashboards tracking attendance, revenue, and engagement metrics." },
  { icon: Zap, title: "Instant Setup", desc: "Launch your event in minutes with customizable templates and one-click publishing." },
  { icon: Users, title: "Team Management", desc: "Collaborate with your team using roles, permissions, and shared dashboards." },
  { icon: Star, title: "Premium Experience", desc: "White-label branding, VIP tiers, and personalized attendee journeys." },
];

const stats = [
  { value: "50K+", label: "Events Hosted" },
  { value: "2M+", label: "Tickets Sold" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9★", label: "User Rating" },
];

const pricing = [
  { name: "Starter", price: "Free", features: ["Up to 50 attendees", "Basic analytics", "Email support", "1 event/month"], popular: false },
  { name: "Professional", price: "$29", features: ["Unlimited attendees", "Advanced analytics", "Priority support", "Custom branding", "Team access"], popular: true },
  { name: "Enterprise", price: "$99", features: ["Everything in Pro", "White-label", "Dedicated manager", "SLA guarantee", "API access"], popular: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Ticket size={16} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">EventHub</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="btn-ghost text-sm">Features</a>
            <a href="#pricing" className="btn-ghost text-sm">Pricing</a>
            <Link to="/events" className="btn-ghost text-sm">Browse Events</Link>
            <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm !px-5 !py-2">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        {/* Background orbs */}
        <div className="orb w-96 h-96 top-20 -left-20 bg-primary animate-pulse-glow" />
        <div className="orb w-80 h-80 bottom-20 right-10 bg-secondary animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        <div className="orb w-64 h-64 top-40 right-1/3 bg-accent animate-pulse-glow" style={{ animationDelay: "3s" }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="badge-primary mb-6 inline-block">✨ The #1 Event Platform</span>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
              Create Unforgettable<br />
              <span className="gradient-text">Events & Experiences</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              The all-in-one platform for event registration, ticketing, and management.
              Beautiful, fast, and built for modern event organizers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="btn-primary text-base flex items-center gap-2">
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link to="/events" className="btn-glass text-base">
              Browse Events
            </Link>
          </motion.div>

          {/* Floating cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-5 text-center card-hover">
                <p className="text-2xl md:text-3xl font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-info mb-4 inline-block">Features</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Powerful tools to create, manage, and grow your events effortlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-2xl p-6 card-hover group"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon size={22} className="text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-primary mb-4 inline-block">Pricing</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg">Start free. Scale as you grow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`rounded-2xl p-6 card-hover relative ${
                  plan.popular ? "glass-strong glow-primary border-primary/30" : "glass"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  {plan.price !== "Free" && <span className="text-muted-foreground text-sm">/month</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check size={14} className="text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block text-center w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95 ${
                    plan.popular ? "btn-primary" : "btn-glass"
                  }`}
                >
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-12 relative overflow-hidden">
          <div className="orb w-64 h-64 -top-20 -right-20 bg-primary" />
          <div className="orb w-48 h-48 -bottom-10 -left-10 bg-secondary" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join thousands of organizers creating amazing events with EventHub.
            </p>
            <Link to="/register" className="btn-primary text-base inline-flex items-center gap-2">
              Create Your First Event <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
              <Ticket size={12} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">EventHub</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 EventHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
