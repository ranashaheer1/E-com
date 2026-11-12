"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCartUI } from "@/context/CartUIContext";

/** Fly-to-bag animation layer only — the kraft bag lives on the Drop room floor */
export function FloatingShopBag() {
  const { bagRef, flyJobs, completeFlyJob } = useCartUI();

  return (
    <AnimatePresence>
      {flyJobs.map((job) => {
        const bag = bagRef.current?.getBoundingClientRect();
        const targetX = bag ? bag.left + bag.width * 0.35 : 40;
        const targetY = bag ? bag.top + bag.height * 0.2 : 400;

        return (
          <motion.img
            key={job.id}
            src={job.image}
            alt=""
            initial={{
              position: "fixed",
              left: job.from.left,
              top: job.from.top,
              width: job.from.width,
              height: job.from.height,
              opacity: 1,
              scale: 1,
              rotate: 0,
              zIndex: 90,
              pointerEvents: "none" as const,
            }}
            animate={{
              left: targetX,
              top: targetY,
              width: 48,
              height: 64,
              opacity: 0.12,
              scale: 0.3,
              rotate: -16,
            }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={() => completeFlyJob(job.id)}
            className="object-contain drop-shadow-xl"
          />
        );
      })}
    </AnimatePresence>
  );
}
