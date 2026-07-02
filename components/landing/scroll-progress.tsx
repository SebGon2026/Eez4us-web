'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="absolute inset-x-0 bottom-0 h-[2.5px] origin-left bg-gradient-to-r from-[hsl(var(--brand-green))] via-[hsl(var(--brand-blue))] to-[hsl(var(--brand-pink))]"
    />
  );
}
