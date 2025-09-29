About Section (White Theme) — Full Implementation Spec

(Single file with everything the AI needs: structure, code, and animation details. Keep your current “ОБО МНЕ” heading. Use TypeScript + React + Tailwind. Works with Vite or Next.js App Router.)

⸻

0) Scope
	•	Preserve your existing big heading “ОБО МНЕ” (do not change its styles).
	•	Replace the body with a two-column white block: left—bio text + animated counters (5+, 13, 100%); right—photo.
	•	Under it, add a three-item services strip.
	•	Under that, add a LogoLoop marquee that scrolls image logos from /public/logos.
	•	Animations:
	•	Counters animate with a spring only when scrolled into view.
	•	LogoLoop scrolls smoothly, pauses on hover (optional), respects prefers-reduced-motion.

⸻

1) Dependencies

# Framer Motion v11 (import path: motion/react)
npm i framer-motion@latest

Next.js App Router only: add "use client" at the top of interactive components.

⸻

2) Project structure (suggested)

src/
  components/
    about/
      AboutBody.tsx
      AboutServices.tsx
      AboutLogos.tsx
    motions/
      CountUp.tsx
    marquees/
      LogoLoop.tsx
public/
  images/
    about-portrait.jpg         # your photo for the right column
  logos/
    brand-1.svg
    brand-2.png
    ...


⸻

3) Animated counter — CountUp.tsx

(Drop this exact file; it implements the “start when in view” spring animation and formatting.)

"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";

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

How to display “5+”, “13”, “100%”:
Render CountUp for the numeric part and append the symbol as plain text:

<span className="inline-flex items-baseline gap-1">
  <CountUp to={5} duration={1.1} className="tabular-nums" />
  <span aria-hidden className="text-3xl">+</span>
</span>

<span className="inline-flex items-baseline">
  <CountUp to={100} duration={1.1} className="tabular-nums" />
  <span aria-hidden className="text-3xl">%</span>
</span>


⸻

4) Marquee — LogoLoop.tsx

(Smooth infinite loop, pause on hover, optional edge fade. Tailwind uses scale-[1.2].)

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type LogoItem =
  | { node: React.ReactNode; href?: string; title?: string; ariaLabel?: string }
  | { src: string; alt?: string; href?: string; title?: string; srcSet?: string; sizes?: string; width?: number; height?: number };

export interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number;
  direction?: "left" | "right";
  width?: number | string;
  logoHeight?: number;
  gap?: number;
  pauseOnHover?: boolean;
  fadeOut?: boolean;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

const CFG = { SMOOTH_TAU: 0.25, MIN_COPIES: 2, COPY_HEADROOM: 2 } as const;

const toCss = (v?: number | string) => (typeof v === "number" ? `${v}px` : v ?? undefined);
const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

const useResizeObserver = (cb: () => void, refs: Array<React.RefObject<Element | null>>, deps: React.DependencyList) => {
  useEffect(() => {
    if (!("ResizeObserver" in window)) {
      const onR = () => cb();
      window.addEventListener("resize", onR);
      cb();
      return () => window.removeEventListener("resize", onR);
    }
    const obs = refs.map((r) => {
      if (!r.current) return null;
      const o = new ResizeObserver(cb);
      o.observe(r.current);
      return o;
    });
    cb();
    return () => obs.forEach((o) => o?.disconnect());
  }, deps);
};

const useImageLoader = (seqRef: React.RefObject<HTMLUListElement | null>, onLoad: () => void, deps: React.DependencyList) => {
  useEffect(() => {
    const imgs = seqRef.current?.querySelectorAll("img") ?? [];
    if (imgs.length === 0) return onLoad();
    let left = imgs.length;
    const done = () => (--left === 0 ? onLoad() : undefined);
    imgs.forEach((i) => {
      const el = i as HTMLImageElement;
      el.complete ? done() : (el.addEventListener("load", done, { once: true }), el.addEventListener("error", done, { once: true }));
    });
    return () => imgs.forEach((i) => {
      i.removeEventListener("load", done);
      i.removeEventListener("error", done);
    });
  }, deps);
};

const useAnimationLoop = (
  trackRef: React.RefObject<HTMLDivElement | null>,
  targetVelocity: number,
  seqWidth: number,
  isHovered: boolean,
  pauseOnHover: boolean
) => {
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const offset = useRef(0);
  const vel = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (seqWidth > 0) {
      offset.current = ((offset.current % seqWidth) + seqWidth) % seqWidth;
      track.style.transform = `translate3d(${-offset.current}px,0,0)`;
    }
    if (reduce) {
      track.style.transform = "translate3d(0,0,0)";
      return () => (last.current = null);
    }

    const step = (ts: number) => {
      if (last.current === null) last.current = ts;
      const dt = Math.max(0, ts - last.current) / 1000;
      last.current = ts;

      const goal = pauseOnHover && isHovered ? 0 : targetVelocity;
      const ease = 1 - Math.exp(-dt / CFG.SMOOTH_TAU);
      vel.current += (goal - vel.current) * ease;

      if (seqWidth > 0) {
        let next = offset.current + vel.current * dt;
        next = ((next % seqWidth) + seqWidth) % seqWidth;
        offset.current = next;
        track.style.transform = `translate3d(${-offset.current}px,0,0)`;
      }
      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = null;
    };
  }, [targetVelocity, seqWidth, isHovered, pauseOnHover]);
};

export const LogoLoop = React.memo<LogoLoopProps>(function LogoLoop({
  logos,
  speed = 120,
  direction = "left",
  width = "100%",
  logoHeight = 28,
  gap = 32,
  pauseOnHover = true,
  fadeOut = false,
  fadeOutColor,
  scaleOnHover = false,
  ariaLabel = "Partner logos",
  className,
  style
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLUListElement>(null);

  const [seqWidth, setSeqWidth] = useState(0);
  const [copies, setCopies] = useState(CFG.MIN_COPIES);
  const [hover, setHover] = useState(false);

  const velocity = useMemo(() => {
    const mag = Math.abs(speed);
    const dir = direction === "left" ? 1 : -1;
    const sign = speed < 0 ? -1 : 1;
    return mag * dir * sign;
  }, [speed, direction]);

  const measure = useCallback(() => {
    const cw = containerRef.current?.clientWidth ?? 0;
    const sw = seqRef.current?.getBoundingClientRect?.()?.width ?? 0;
    if (sw > 0) {
      setSeqWidth(Math.ceil(sw));
      setCopies(Math.max(CFG.MIN_COPIES, Math.ceil(cw / sw) + CFG.COPY_HEADROOM));
    }
  }, []);

  useResizeObserver(measure, [containerRef, seqRef], [logos, gap, logoHeight]);
  useImageLoader(seqRef, measure, [logos, gap, logoHeight]);
  useAnimationLoop(trackRef, velocity, seqWidth, hover, pauseOnHover);

  const vars = useMemo(
    () =>
      ({
        "--logoloop-gap": `${gap}px`,
        "--logoloop-logoHeight": `${logoHeight}px`,
        ...(fadeOutColor && { "--logoloop-fadeColor": fadeOutColor })
      }) as React.CSSProperties,
    [gap, logoHeight, fadeOutColor]
  );

  const root = useMemo(
    () =>
      cx(
        "relative overflow-x-hidden group",
        "[--logoloop-gap:32px]",
        "[--logoloop-logoHeight:28px]",
        "[--logoloop-fadeColorAuto:#ffffff]", // white page background
        scaleOnHover && "py-[calc(var(--logoloop-logoHeight)*0.1)]",
        className
      ),
    [scaleOnHover, className]
  );

  const renderItem = useCallback(
    (item: LogoItem, key: React.Key) => {
      const isNode = "node" in item;
      const content = isNode ? (
        <span
          className={cx(
            "inline-flex items-center",
            "motion-reduce:transition-none",
            scaleOnHover && "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/item:scale-[1.2]"
          )}
          aria-hidden={!!(item as any).href && !(item as any).ariaLabel}
        >
          {(item as any).node}
        </span>
      ) : (
        <img
          className={cx(
            "h-[var(--logoloop-logoHeight)] w-auto block object-contain",
            "[-webkit-user-drag:none] pointer-events-none",
            "[image-rendering:-webkit-optimize-contrast]",
            "motion-reduce:transition-none",
            scaleOnHover && "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/item:scale-[1.2]"
          )}
          src={(item as any).src}
          srcSet={(item as any).srcSet}
          sizes={(item as any).sizes}
          width={(item as any).width}
          height={(item as any).height}
          alt={(item as any).alt ?? ""}
          title={(item as any).title}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      );

      const aria = isNode ? (item as any).ariaLabel ?? (item as any).title : (item as any).alt ?? (item as any).title;

      const inner = (item as any).href ? (
        <a
          className="inline-flex items-center no-underline rounded transition-opacity duration-200 ease-linear hover:opacity-80 focus-visible:outline focus-visible:outline-current focus-visible:outline-offset-2"
          href={(item as any).href}
          aria-label={aria || "logo link"}
          target="_blank"
          rel="noreferrer noopener"
        >
          {content}
        </a>
      ) : (
        content
      );

      return (
        <li
          key={key}
          role="listitem"
          className={cx("flex-none mr-[var(--logoloop-gap)] text-[length:var(--logoloop-logoHeight)] leading-[1]", scaleOnHover && "overflow-visible group/item")}
        >
          {inner}
        </li>
      );
    },
    [scaleOnHover]
  );

  const lists = useMemo(
    () =>
      Array.from({ length: copies }, (_, i) => (
        <ul key={`copy-${i}`} className="flex items-center" role="list" aria-hidden={i > 0} ref={i === 0 ? seqRef : undefined}>
          {logos.map((it, j) => renderItem(it, `${i}-${j}`))}
        </ul>
      )),
    [copies, logos, renderItem]
  );

  return (
    <div
      ref={containerRef}
      className={root}
      style={{ width: toCss(width) ?? "100%", ...vars, ...style }}
      role="region"
      aria-label={ariaLabel}
      onMouseEnter={() => pauseOnHover && setHover(true)}
      onMouseLeave={() => pauseOnHover && setHover(false)}
    >
      {fadeOut && (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[clamp(24px,8%,120px)] bg-[linear-gradient(to_right,var(--logoloop-fadeColor,var(--logoloop-fadeColorAuto))_0%,rgba(0,0,0,0)_100%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-[clamp(24px,8%,120px)] bg-[linear-gradient(to_left,var(--logoloop-fadeColor,var(--logoloop-fadeColorAuto))_0%,rgba(0,0,0,0)_100%)]" />
        </>
      )}
      <div ref={trackRef} className="flex w-max will-change-transform select-none motion-reduce:transform-none">
        {lists}
      </div>
    </div>
  );
});

export default LogoLoop;


⸻

5) About body (white theme) — AboutBody.tsx

(Place under your existing “ОБО МНЕ” heading.)

"use client";

import CountUp from "@/components/motions/CountUp";

export default function AboutBody() {
  return (
    <section id="about-body" className="relative overflow-hidden rounded-2xl bg-white text-neutral-900 border border-neutral-200">
      {/* optional subtle highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] select-none"
        style={{ background: "radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 60%)" }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT — copy + stats */}
        <div className="px-6 py-12 sm:px-8 md:px-12 lg:py-16">
          <p className="text-xl/7 sm:text-2xl/8 font-medium">
            Меня зовут Алёна Донцова, я дизайнер и декоратор с 2019 года.
          </p>

          <p className="mt-6 text-base/7 text-neutral-600">
            Предпочитаю софт-минимализм с акцентом на детали. Реализую проекты под ключ — от концепции до
            финальной отделки. Победитель ADD Awards 2024, публикуюсь в интерьерных изданиях. Работаю с
            квартирами, домами и коммерческими объектами. Всегда внимательно слушаю заказчика и создаю
            интерьеры, в которых комфортно жить.
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-6 sm:gap-8">
            <div>
              <dt className="sr-only">Years of experience</dt>
              <dd className="text-4xl font-semibold tracking-tight tabular-nums">
                <span className="inline-flex items-baseline gap-1">
                  <CountUp to={5} duration={1.1} />
                  <span aria-hidden className="text-3xl">+</span>
                </span>
                <span className="block mt-2 text-sm font-normal text-neutral-600">лет опыта</span>
              </dd>
            </div>

            <div>
              <dt className="sr-only">Completed projects</dt>
              <dd className="text-4xl font-semibold tracking-tight tabular-nums">
                <CountUp to={13} duration={1.1} />
                <span className="block mt-2 text-sm font-normal text-neutral-600">выполненных проектов</span>
              </dd>
            </div>

            <div>
              <dt className="sr-only">Happy clients</dt>
              <dd className="text-4xl font-semibold tracking-tight tabular-nums">
                <span className="inline-flex items-baseline">
                  <CountUp to={100} duration={1.1} />
                  <span aria-hidden className="text-3xl">%</span>
                </span>
                <span className="block mt-2 text-sm font-normal text-neutral-600">довольных клиентов</span>
              </dd>
            </div>
          </dl>
        </div>

        {/* RIGHT — image */}
        <figure className="relative min-h-[340px] lg:min-h-[540px]">
          <img src="/images/about-portrait.jpg" alt="Портрет на диване с планшетом" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        </figure>
      </div>
    </section>
  );
}


⸻

6) Services strip (white) — AboutServices.tsx

export default function AboutServices() {
  return (
    <section className="mt-10 grid grid-cols-1 gap-8 rounded-2xl bg-white text-neutral-900 border border-neutral-200 px-6 py-10 sm:px-8 md:px-12 lg:grid-cols-3">
      <div>
        <h3 className="text-xl font-medium">реализация<br />под ключ</h3>
        <p className="mt-3 text-sm text-neutral-600">Сотрудничаю с проверенными строительными бригадами — возможно полное ведение проекта под ключ.</p>
      </div>
      <div>
        <h3 className="text-xl font-medium">авторский<br />надзор</h3>
        <p className="mt-3 text-sm text-neutral-600">Осуществляю авторский надзор, чтобы реализовать дизайн точно по задумке.</p>
      </div>
      <div>
        <h3 className="text-xl font-medium">гибкость<br />в локации</h3>
        <p className="mt-3 text-sm text-neutral-600">Работаю в Санкт-Петербурге, Москве, а также рассматриваю проекты в других регионах.</p>
      </div>
    </section>
  );
}


⸻

7) Logo usage block — AboutLogos.tsx

(You will place files in /public/logos. List them here.)

"use client";

import LogoLoop from "@/components/marquees/LogoLoop";

const imageLogos = [
  { src: "/logos/brand-1.svg", alt: "Brand 1", href: "https://example.com" },
  { src: "/logos/brand-2.png", alt: "Brand 2", href: "https://example.com" },
  { src: "/logos/brand-3.svg", alt: "Brand 3", href: "https://example.com" },
  // add more logos as needed
];

export default function AboutLogos() {
  return (
    <div className="mt-10">
      <LogoLoop
        logos={imageLogos}
        speed={120}
        direction="left"
        logoHeight={48}
        gap={40}
        pauseOnHover
        scaleOnHover
        fadeOut
        fadeOutColor="#ffffff"   // white page background
        ariaLabel="Partners and technologies"
      />
    </div>
  );
}


⸻

8) Compose on the page

Render these under your existing heading “ОБО МНЕ”:

import AboutBody from "@/components/about/AboutBody";
import AboutServices from "@/components/about/AboutServices";
import AboutLogos from "@/components/about/AboutLogos";

export default function AboutSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* Your current big “ОБО МНЕ” heading remains ABOVE this section */}

      <div className="mt-6">
        <AboutBody />
      </div>

      <AboutServices />

      <AboutLogos />
    </section>
  );
}


⸻

9) Animation notes (so AI “gets it”)
	•	Counters (CountUp)
	•	Start from from (default 0) and animate to to only once when the element is visible (useInView(..., { once: true })).
	•	Spring is computed from duration:
damping = 20 + 40 * (1 / duration), stiffness = 100 * (1 / duration) for a responsive “snap”.
	•	Use Intl.NumberFormat for grouping/decimals; custom separator supported.
	•	Append symbols (+, %) as separate spans to avoid interfering with the animated numeric value.
	•	LogoLoop
	•	Measures the first <ul> width; duplicates it enough times to cover container + headroom; scrolls the track with a smooth velocity integrator.
	•	Velocity eases to speed or to 0 (on hover if pauseOnHover=true) with time constant SMOOTH_TAU=0.25.
	•	Respects prefers-reduced-motion: reduce → stops animation.
	•	Uses Tailwind JIT arbitrary scale: group-hover/item:scale-[1.2].

⸻

10) QA / Acceptance
	•	White theme preserved (bg-white, text-neutral-900, subtle borders).
	•	“ОБО МНЕ” heading looks exactly like before.
	•	Bio + photo two-column layout; photo fully covers right area, responsive.
	•	Counters animate once on scroll: 5+, 13, 100%.
	•	Services block shows three items; stacks on mobile.
	•	LogoLoop pulls images from /public/logos, scrolls smoothly, pauses on hover, fades edges on white.
	•	A11y: images have alt; external links use rel="noreferrer noopener".

⸻

11) Suggested commits

feat(about): white-theme two-column body with animated counters
feat(about): services strip (3 items)
feat(ui): LogoLoop marquee using images from /public/logos
chore: add framer-motion v11

That’s it — one spec with all code and the exact animation behavior.