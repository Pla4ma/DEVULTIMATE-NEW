import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const fadeInUpVariants: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

interface AppearProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export function Appear({
  children,
  delay = 0,
  duration = 0.6,
  className = "",
  once = true,
}: AppearProps) {
  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{ once, amount: 0.1 }}
      variants={fadeInUpVariants}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
