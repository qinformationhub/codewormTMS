import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, LogIn, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import heroAsset from "@/assets/login-bg-trucks.png";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/bf101-logo.webp";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Operator Terminal — BF101 LLC FREIGHT LOGDOG" },
      {
        name: "description",
        content:
          "Sign in to the BF101 LLC FREIGHT LOGDOG operator terminal to manage regulated freight across broker, shipper and carrier portals.",
      },
      { property: "og:title", content: "Operator Terminal — BF101 LLC FREIGHT LOGDOG" },
      {
        property: "og:description",
        content: "Secure access to the BF101 logistics command center.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [persist, setPersist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="relative min-h-screen bg-slate-950 font-inter overflow-hidden flex items-center justify-center">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            x: [0, -16, 0],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-full h-full"
        >
          <img
            src={heroAsset}
            alt="Global Logistics Network"
            className="w-full h-full object-cover opacity-90 brightness-110 scale-110"
          />
        </motion.div>
        <div className="absolute inset-0 bg-slate-950/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-transparent to-[#1E3A8A]/20" />


        
        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-20 w-full max-w-6xl px-6 py-12 lg:px-12 flex flex-col lg:flex-row gap-16 items-center">
        
        {/* Left Side: Brand & Visuals */}
        <div className="flex-1 space-y-12 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-full">
              <span className="size-2 bg-[#DC2626] rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-[#DC2626] uppercase tracking-[0.2em]">
                System Online: v2.4.0
              </span>
            </div>

            <div className="py-4">
           
              <img src={logoAsset} className="h-16 w-auto object-contain mx-auto lg:mx-0" />
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-[0.9] font-space">
              Precision
              <br />
              <span className="text-white/40">Logistics.</span>
            </h1>
            
            <p className="text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              The next generation of transport management. Secure, efficient, and 
              engineered for high-scale brokerage operations.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="grid grid-cols-3 gap-8 pt-12 border-t border-white/5"
          >
            {[
              { label: "Uptime", value: "99.9%" },
              { label: "Active Nodes", value: "1,284" },
              { label: "Throughput", value: "High" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-white font-space">{stat.value}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Side: Authentication Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-[420px] bg-slate-950/40 backdrop-blur-2xl border border-white/10 p-8 md:p-10 shadow-[0_0_80px_-10px_rgba(15,23,42,0.8),0_0_50px_-12px_rgba(30,58,138,0.7)]"
        >
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white font-space tracking-tight">Terminal Access</h2>
            <p className="text-slate-400 text-sm mt-2">Authenticated personnel only.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity</label>
              <div className="relative group">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full h-14 bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/10 focus:outline-none focus:border-[#DC2626]/50 transition-colors"
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-white/20 group-focus-within:text-[#DC2626] transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Code</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/10 focus:outline-none focus:border-[#DC2626]/50 transition-colors"
                />
                <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-white/20 group-focus-within:text-[#DC2626] transition-colors" />
              </div>
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="persist"
                checked={persist}
                onChange={(e) => setPersist(e.target.checked)}
                className="size-4 accent-[#DC2626] border-white/10 bg-transparent rounded-none"
              />
              <label htmlFor="persist" className="text-xs text-slate-400 cursor-pointer hover:text-white transition-colors">
                Maintain Secure Session
              </label>
            </div>

            <button
              disabled={loading}
              className="w-full h-14 bg-[#DC2626] text-white font-bold text-[13px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 hover:bg-[#DC2626]/90 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? "Decrypting..." : "Initialize Command"}
              <LogIn className="size-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            <ShieldCheck className="size-3" />
            Encrypted End-to-End
          </div>
        </motion.div>
      </div>

      {/* Ambient Footer */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] z-20">
        <div>BF101 LLC FREIGHT LOGDOG</div>
        <div className="hidden sm:block">Hardware Acceleration: Active</div>
        <div>Terminal ID: 882-QX</div>
      </div>
    </div>
  );
}
