import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

export function StatCounter({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const num = parseFloat(value.replace(/[^\d.]/g, "")) || 0;
  const suffix = value.replace(/[\d.,]/g, "");
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (latest) => {
    const v = Math.round(latest);
    return v.toLocaleString() + suffix;
  });

  useEffect(() => {
    if (inView) {
      const ctrl = animate(mv, num, { duration: 1.6, ease: "easeOut" });
      return ctrl.stop;
    }
  }, [inView, mv, num]);

  return (
    <div ref={ref} className="text-center">
      <motion.div className="font-display text-3xl font-bold text-foreground md:text-4xl">
        {rounded}
      </motion.div>
      <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
