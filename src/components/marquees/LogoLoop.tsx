/* eslint-disable @typescript-eslint/no-explicit-any */
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
        "[--logoloop-fadeColorAuto:#FAFAFA]",
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
