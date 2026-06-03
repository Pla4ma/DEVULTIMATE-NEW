import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { LogoMark } from "@/components/Logo";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  onDemo: () => Promise<void>;
}

export function AuthModal({ open, onClose, onSignIn, onSignUp, onDemo }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMsg("");
    setLoading(true);
    try {
      if (tab === "login") {
        await onSignIn(email.trim(), password);
      } else {
        const { needsEmailConfirmation } = await onSignUp(email.trim(), password);
        if (needsEmailConfirmation) setMsg("Check your email to confirm your account.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setError(""); setLoading(true);
    try { await onDemo(); }
    catch (err) { setError(err instanceof Error ? err.message : "Demo mode failed"); }
    finally { setLoading(false); }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="grain relative w-full max-w-md glass p-8 overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--text-tertiary)" }} aria-label="Close">
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <LogoMark size={40} animated />
              <div>
                <h3 className="text-lg font-bold text-display tracking-tight" style={{ color: "var(--text-primary)" }}>{tab === "login" ? "Welcome back" : "Create your account"}</h3>
                <p className="eyebrow mt-0.5" style={{ color: "var(--signal)" }}>Ship with evidence</p>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              {(["login", "signup"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(""); setMsg(""); }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: tab === t ? "var(--signal-soft)" : "var(--surface-2)",
                    color: tab === t ? "var(--signal)" : "var(--text-tertiary)",
                    border: `1px solid ${tab === t ? "var(--signal)" : "var(--border-default)"}`,
                  }}
                >
                  {t === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              </div>

              {error && <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}
              {msg && <p className="text-xs" style={{ color: "var(--color-success)" }}>{msg}</p>}

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: "var(--signal)", color: "var(--surface-0)", opacity: loading ? 0.7 : 1, boxShadow: "var(--shadow-glow)" }}>
                {loading ? "Loading..." : tab === "login" ? "Sign In" : "Create Account"}
              </motion.button>
            </form>

            <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleDemo} className="w-full py-3 text-sm font-medium glass">
                <Sparkles size={14} className="inline mr-2" /> Try Demo Mode
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
