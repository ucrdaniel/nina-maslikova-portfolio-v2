/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export default function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  onStart,
  onEnd
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  // Start value depends on direction
  const motionValue = useMotionValue(direction === "down" ? to : from);

  // Spring tuned by duration (shorter = snappier)
  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, { damping, stiffness });

  // Trigger only once when the number becomes visible
  const isInView = useInView(ref, { once: true, margin: "0px" });

  // Helpers to keep decimals if from/to include them
  const getDecimalPlaces = (num: number) => {
    const s = String(num);
    if (!s.includes(".")) return 0;
    const decimals = s.split(".")[1];
    return parseInt(decimals) !== 0 ? decimals.length : 0;
  };
  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  // Set initial content immediately
  useEffect(() => {
    if (ref.current) ref.current.textContent = String(direction === "down" ? to : from);
  }, [from, to, direction]);

  // Start animation when in view (with optional delay)
  useEffect(() => {
    if (!isInView || !startWhen) return;

    onStart?.();

    const t1 = setTimeout(() => {
      motionValue.set(direction === "down" ? from : to);
    }, delay * 1000);

    const t2 = setTimeout(() => onEnd?.(), (delay + duration) * 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

  // Render formatted number on spring change
  useEffect(() => {
    const unsub = springValue.on("change", (latest) => {
      if (!ref.current) return;

      const hasDecimals = maxDecimals > 0;
      const options: Intl.NumberFormatOptions = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0
      };
      const formatted = Intl.NumberFormat("en-US", options).format(latest);
      ref.current.textContent = separator ? formatted.replace(/,/g, separator) : formatted;
    });

    return () => unsub();
  }, [springValue, separator, maxDecimals]);

  return <span ref={ref} className={className} />;
}
