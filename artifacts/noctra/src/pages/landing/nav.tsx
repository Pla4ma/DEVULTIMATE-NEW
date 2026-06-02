import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Magnetic } from "@/components/effects/Magnetic";
import { BeamButton } from "@/components/effects/BeamButton";
import { Menu, X, ArrowRight } from "lucide-react";

const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

interface NavProps {
  onCta: () => void;
  onSignIn: () => void;
}

export function Nav({ onCta, onSignIn }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          borderColor: scrolled ? "rgba(255,255,255,0.06)" : "transparent",
          borderBottom: scrolled ? "1px solid" : "1px solid transparent",
          background: scrolled
            ? "linear-gradient(180deg, rgba(3,0,10,0.85) 0%, rgba(3,0,10,0.6) 100%)"
            : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        }}
      >
        <div className="section-container h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <Logo size={26} />
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Magnetic key={item.label} strength={0.15}>
                <a
                  href={item.href}
                  className="text-sm transition-colors duration-300 nav-underline"
                  style={{ color: "#b4aec8" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#f5f0ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#b4aec8")}
                >
                  {item.label}
                </a>
              </Magnetic>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="text-sm transition-colors duration-200"
              style={{ color: "#b4aec8" }}
            >
              Sign in
            </button>
            <Magnetic strength={0.25}>
              <BeamButton
                variant="primary"
                size="sm"
                onClick={onCta}
                iconRight={<ArrowRight size={13} />}
              >
                Get started
              </BeamButton>
            </Magnetic>
          </div>

          <button
            className="md:hidden w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-1.5"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            style={{ color: "#f5f0ff" }}
          >
            {mobileOpen ? <X size={18} /> : (
              <>
                <span className="burger-line w-5" />
                <span className="burger-line w-3" />
                <span className="burger-line w-5" />
              </>
            )}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(3,0,10,0.85)", backdropFilter: "blur(20px)" }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.nav
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              className="pt-24 px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-2xl font-semibold py-3"
                    style={{ color: "#f5f0ff" }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onSignIn();
                  }}
                  className="w-full py-3 rounded-xl text-sm glass-2026"
                  style={{ color: "#f5f0ff" }}
                >
                  Sign in
                </button>
                <BeamButton
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setMobileOpen(false);
                    onCta();
                  }}
                  className="w-full"
                >
                  Get started
                </BeamButton>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
