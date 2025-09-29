/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import heroPic from "/images/her-pic.png?url";

/**
 * NINA.MASLIKOVA — One-Page Portfolio (React + Tailwind)
 * - Stable exports for HMR: default App + named translate
 * - Hero background via URL or /public file
 * - Local paths like "3-red.jpg" auto-normalize to "/3-red.jpg"
 * - Drive/Dropbox/GitHub links auto-convert to direct image URLs
 * - Smooth animations, vertical projects, lightbox
 */

// ========= Helpers

// Turn share links into direct image links (Drive/Dropbox/GitHub)
const resolveDirectImage = (url: string) => {
  try {
    if (!url) return url;
    const u = new URL(url, window.location.origin);

    // Google Drive: https://drive.google.com/file/d/FILE_ID/view?...
    if (u.hostname.includes("drive.google.com")) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = m ? m[1] : u.searchParams.get("id");
      if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
    }

    // Dropbox: https://www.dropbox.com/s/..../file.jpg?dl=0 -> dl.dropboxusercontent.com/...
    if (u.hostname.includes("dropbox.com")) {
      return url
        .replace("www.dropbox.com", "dl.dropboxusercontent.com")
        .replace("?dl=0", "");
    }

    // GitHub: https://github.com/user/repo/blob/branch/path.jpg -> raw.githubusercontent.com/...
    if (u.hostname.includes("github.com")) {
      return url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
    }

    return url;
  } catch {
    return url;
  }
};

// "/public" normalizer: "3-red.jpg" -> "/3-red.jpg"; remote/data: URLs stay unchanged
const normalizeLocalSrc = (src: string) => {
  if (!src) return src;
  if (/^(https?:|data:)/.test(src)) return src;
  return src.startsWith("/") ? src : "/" + src;
};

// Full resolver used everywhere
const resolveSrc = (src: string) => resolveDirectImage(normalizeLocalSrc(src));

// Neutral placeholder (no broken icon if file missing)
const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">' +
      '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
      '<stop stop-color="#eeeeee" offset="0"/><stop stop-color="#dcdcdc" offset="1"/>' +
      '</linearGradient><rect width="100%" height="100%" fill="url(#g)"/>' +
    "</svg>"
  );




const Container = ({ children, className = "" }) => (
  <div className={`max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
);

const Section = ({ id, children, className = "", as: Tag = "section" }) => (
  <Tag id={id} className={`scroll-mt-24 md:scroll-mt-32 py-24 sm:py-32 lg:py-40 ${className}`}>{children}</Tag>
);

const Reveal = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
};

// ========= Scroll progress (Sempre-style)
const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const height = h.scrollHeight - h.clientHeight;
      setProgress(height ? scrolled / height : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-1.5 bg-transparent">
      <div
        className="h-full origin-left bg-[#FF4500] transition-[width] duration-150 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
      />
    </div>
  );
};

// ========= Lightbox
const Lightbox = ({ images, index, onClose, onPrev, onNext }) => {
  if (index === null) return null;
  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[index]?.src}
          alt={images[index]?.alt}
          className="w-full h-[70vh] object-contain rounded"
        />
        <button aria-label="Close" onClick={onClose} className="absolute -top-4 -right-4 bg-white text-black font-medium rounded-full px-3 py-1 shadow hover:scale-105 transition">
          ×
        </button>
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
          <button aria-label="Previous" onClick={onPrev} className="bg-white/80 text-black px-3 py-2 rounded hover:bg-white">‹</button>
          <button aria-label="Next" onClick={onNext} className="bg-white/80 text-black px-3 py-2 rounded hover:bg-white">›</button>
        </div>
        <div className="absolute bottom-3 inset-x-0 text-center text-white text-sm/relaxed">
          {images[index]?.caption}
        </div>
      </div>
    </motion.div>
  );
};

// ========= Runtime self-tests (basic)
function runSelfTests() {
  try {
    const ru = translate("ru");
    const en = translate("en");

    const must = ["nav", "cta", "hero", "about", "projects", "skills", "awards", "contact", "footer"];
    must.forEach((k) => {
      if (!(k in ru)) throw new Error(`RU missing key: ${k}`);
      if (!(k in en)) throw new Error(`EN missing key: ${k}`);
    });

    const imgCount = 3;
    if (ru.projects.cards.length !== imgCount || en.projects.cards.length !== imgCount) {
      throw new Error(`Projects/cards mismatch with images (${imgCount})`);
    }

    const scanStrings = (obj) => {
      for (const v of Object.values(obj)) {
        if (typeof v === "string" && v.includes("\\")) {
          throw new Error(`Backslash in string: ${v.slice(0, 40)}…`);
        } else if (v && typeof v === "object") scanStrings(v);
      }
    };
    scanStrings(ru);
    scanStrings(en);

    if (ru.hero.name === en.hero.name) throw new Error("Lang switch ineffective");

    console.info("Self-tests passed ✅");
  } catch (e) {
    console.error("Self-tests failed ❌:", e);
  }
}

// Custom hook for prefers-reduced-motion
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const listener = (event) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);
  
  return prefersReducedMotion;
}

// ========= App
export default function App() {
  // Load fonts and preload hero image
  useEffect(() => {
    // Load Roboto Mono
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    
    // Load Herbus-Pointy for logo
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: 'Herbus';
        src: url('/fonts/Herbus-Pointy.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
    
    // Preload hero image for better LCP
    const preloadLink = document.createElement("link");
    preloadLink.href = "/images/her-pic.png";
    preloadLink.rel = "preload";
    preloadLink.as = "image";
    preloadLink.type = "image/png";
    preloadLink.fetchPriority = "high";
    document.head.appendChild(preloadLink);
    
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
      document.head.removeChild(preloadLink);
    };
  }, []);

  // Language toggle with persistence
  const [lang, setLang] = useState(() => {
    // Try to get language from localStorage first
    const savedLang = localStorage.getItem("lang");
    if (savedLang === "ru" || savedLang === "en") return savedLang;
    
    // Try to detect browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("ru")) return "ru";
    
    // Default to Russian
    return "ru";
  });
  
  // Update localStorage when language changes
  const handleSetLang = (newLang: "ru" | "en") => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };
  
  const t = useMemo(() => translate(lang), [lang]);

  // Hero background — can be remote or /public/hero.jpg
  // Hero image path is applied directly in the style attribute

  // Run tests
  useEffect(() => { runSelfTests(); }, []);

  // Nav highlighting (with header compensation + scroll margins on sections)
  const [active, setActive] = useState("home");
  const [expandedAward, setExpandedAward] = useState(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  useEffect(() => {
    const ids = ["home", "about", "projects", "awards", "contact"];
    const handle = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const probe = scrollY + vh * 0.33;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.offsetTop;
        if (top - 120 <= probe) current = id;
      }
      setActive(current);
    };
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, []);

  // Project images (replace with your own)
  const projectImages = [
    {
      src: "/images/3-red.jpg",
      alt: "Sectional residential complex",
      caption: t.projects.cards[0].title,
    },
    {
      src: "/images/1_render.png",
      alt: "Apartment interior visualization",
      caption: t.projects.cards[1].title,
    },
    {
      src: "/images/pic-36.png",
      alt: "Working drawings / details",
      caption: t.projects.cards[2].title,
    },
  ];

  // Resolve all sources (handles "3-red.jpg", Drive, etc.)
  const resolvedProjectImages = projectImages;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const open = (i: number) => setLightboxIndex(i);
  const close = () => setLightboxIndex(null);
  const prev = () =>
    setLightboxIndex((i) => (i === null ? null : (i + resolvedProjectImages.length - 1) % resolvedProjectImages.length));
  const next = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % resolvedProjectImages.length));

  return (
    <div
      className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A]"
      style={{ fontFamily: '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
    >
      <ScrollProgress />

      {/* Header */}
      <header className="fixed top-4 left-0 right-0 z-40">
        <div className="max-w-[1600px] mx-auto">
          <div className="mx-4 sm:mx-6 lg:mx-8 rounded-2xl bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/40 shadow-lg border border-[#E5E5E5]">
            <Container>
              <nav className="flex items-center justify-between py-4">
            <a href="#home" className="text-base sm:text-2xl font-bold tracking-wider uppercase hover:opacity-80 transition text-[#FF4500]" style={{ fontFamily: '"Herbus", sans-serif' }}>NINA.MASLIKOVA</a>
            <div className="hidden md:flex gap-8 text-sm uppercase">
              {[
                { id: "about", label: t.nav.about },
                { id: "projects", label: t.nav.projects },
                { id: "awards", label: t.nav.awards },
                { id: "contact", label: t.nav.contact },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`border-b-2 pb-1 transition-colors ${active === item.id ? "border-[#FF4500]" : "border-transparent hover:border-[#FF4500]"}`}
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="flex items-center">
              <div className="flex overflow-hidden border-2 border-[#FF4500] text-xs sm:text-sm">
                <button
                  onClick={() => handleSetLang("ru")}
                  className={`uppercase font-semibold px-2 sm:px-3 py-2 transition ${lang === "ru" ? "bg-[#FF4500] text-white" : "text-[#FF4500] hover:bg-[#FF4500] hover:text-white"}`}
                  aria-label="Switch to Russian"
                  aria-pressed={lang === "ru"}
                >
                  RU
                </button>
                <div className="w-px bg-[#FF4500]"></div>
                <button
                  onClick={() => handleSetLang("en")}
                  className={`uppercase font-semibold px-2 sm:px-3 py-2 transition ${lang === "en" ? "bg-[#FF4500] text-white" : "text-[#FF4500] hover:bg-[#FF4500] hover:text-white"}`}
                  aria-label="Switch to English"
                  aria-pressed={lang === "en"}
                >
                  EN
                </button>
              </div>
            </div>
          </nav>
        </Container>
          </div>
        </div>
      </header>

      {/* Hero — background image fills before About */}
      <Section 
        id="home" 
        className="min-h-screen flex items-end pt-32 lg:pt-40 relative overflow-hidden"
      >
        {/* Background image */}
        <img 
          src={heroPic}
          alt="Hero background"
          className="absolute left-0 w-full h-full object-cover"
          style={{ minWidth: '100%', minHeight: '100%', top: '-2%'}}
        />
        {/* Soft gradient to keep text readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-white/10 to-transparent pointer-events-none" />
        <Container className="relative z-10">
          {/* Align with site grid */}
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 w-full">
            <div className="lg:col-span-10 xl:col-span-9">
              <Reveal>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold uppercase leading-[1.05] tracking-[-0.02em] drop-shadow-lg">
                  {t.hero.name}
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-8 text-lg sm:text-xl lg:text-2xl text-[#333] max-w-4xl leading-relaxed drop-shadow-md">
                  {t.hero.tagline}
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-12 flex flex-wrap gap-4">
                  <a href="#projects" className="uppercase text-sm font-semibold border-2 border-[#FF4500] text-[#FF4500] px-6 py-3 hover:bg-[#FF4500] hover:text-white transition">
                    {t.hero.viewWork}
                  </a>
                  <a href="#contact" className="uppercase text-sm font-semibold border px-6 py-3 hover:bg-[#F5F5F5]">
                    {t.hero.contact}
                  </a>
                </div>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="mt-12 text-base text-[#666] drop-shadow-md">
                  {t.hero.location}
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* About — with skills chips merged in */}
      <Section id="about" className="bg-white/40">
        <Container>
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-8 xl:col-span-9">
              <Reveal>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold uppercase mb-10">{t.about.title}</h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-lg text-[#333] leading-relaxed mb-8">{t.about.p1}</p>
              </Reveal>
              <Reveal delay={0.15}>
                <p className="text-lg text-[#333] leading-relaxed">{t.about.p2}</p>
              </Reveal>
              <Reveal delay={0.25}>
                <div className="mt-12">
                  <h3 className="text-base uppercase tracking-wide text-[#666] mb-6">{lang === "ru" ? "Навыки и софт" : "Skills & Software"}</h3>
                  <ul className="flex flex-wrap gap-3">
                    {t.skills.items.map((s, i) => (
                      <li key={i} className="px-4 py-2 rounded-full border border-[#E5E5E5] bg-white/70 text-sm">
                        {s.name}{s.note ? <span className="text-[#666]"> — {s.note}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
            <div className="lg:col-span-4 xl:col-span-3">
              <Reveal>
                <div className="rounded-xl border border-[#E5E5E5] p-8 bg-white/70 backdrop-blur-sm">
                  <dl className="grid grid-cols-1 gap-6 text-base">
                    <div>
                      <dt className="text-[#666] mb-1">{t.about.quick.roleL}</dt>
                      <dd className="font-medium">{t.about.quick.role}</dd>
                    </div>
                    <div>
                      <dt className="text-[#666] mb-1">{t.about.quick.locationL}</dt>
                      <dd className="font-medium">St. Petersburg, Russia</dd>
                    </div>
                    <div>
                      <dt className="text-[#666] mb-1">{t.about.quick.langsL}</dt>
                      <dd className="font-medium">Russian, English</dd>
                    </div>
                    <div>
                      <dt className="text-[#666] mb-1">{t.about.quick.contactL}</dt>
                      <dd className="font-medium">ninamaslikova211003@gmail.com</dd>
                    </div>
                  </dl>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* Projects — vertical stack with bigger images */}
      <Section id="projects" className="">
        <Container>
          <Reveal>
            <div className="flex items-end justify-between mb-16">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold uppercase">{t.projects.title}</h2>
              <div className="hidden sm:flex gap-3 text-sm">
                {t.projects.filters.map((f) => (
                  <span key={f} className="px-4 py-2 border rounded-full hover:bg-white/50 transition cursor-pointer">{f}</span>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="space-y-16 lg:space-y-24">
            {t.projects.cards.map((card, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <article className="group border border-[#E5E5E5] bg-white/70 backdrop-blur rounded-xl overflow-hidden">
                  <button onClick={() => open(i)} className="block w-full text-left">
                    <div className="relative aspect-[3/1.8] overflow-hidden">
                      <img
                        src={resolvedProjectImages[i]?.src}
                        alt={projectImages[i]?.alt}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-6 left-6 uppercase text-sm tracking-widest font-semibold text-white/90">{card.category}</div>
                    </div>
                    <div className="p-8 lg:p-10">
                      <h3 className="font-semibold text-2xl lg:text-3xl">{card.title}</h3>
                      <p className="text-lg text-[#333] mt-4 leading-relaxed">{card.desc}</p>
                      {card.meta && (
                        <ul className="mt-6 text-base text-[#333] grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {card.meta.map((m, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </button>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="mt-6 text-xs text-[#666]">
            {t.projects.note}
          </div>
        </Container>
      </Section>

      {/* Awards */}
      <Section id="awards" className="">
        <Container>
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold uppercase mb-8">{t.awards.title}</h2>
          </Reveal>
          <div className="divide-y divide-[#E5E5E5]">
            {t.awards.items.map((award, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="py-4">
                  <button
                    onClick={() => setExpandedAward(expandedAward === i ? null : i)}
                    className="w-full text-left flex items-center justify-between hover:opacity-80 transition-opacity"
                    aria-expanded={expandedAward === i}
                    aria-controls={`award-content-${i}`}
                  >
                    <span className="font-medium text-lg pr-4">{award.title}</span>
                    <div 
                      className={`text-2xl font-light transition-transform duration-300 ease-in-out ${
                        expandedAward === i ? 'rotate-[225deg]' : 'rotate-0'
                      }`}
                      style={{ transformOrigin: 'center' }}
                      aria-hidden="true"
                    >
                      +
                    </div>
                  </button>
                  <div 
                    id={`award-content-${i}`}
                    className={`overflow-hidden ${!prefersReducedMotion ? `transition-all duration-300 ${expandedAward === i ? 'ease-out' : 'ease-in'}` : ''}`}
                    style={{ 
                      maxHeight: expandedAward === i ? '200px' : '0px',
                      opacity: expandedAward === i ? 1 : 0,
                      transition: prefersReducedMotion ? 'none' : undefined
                    }}
                  >
                    <div className={`pt-4 text-[#666] transform ${!prefersReducedMotion ? `transition-transform duration-300 ${expandedAward === i ? 'translate-y-0' : 'translate-y-2'}` : ''}`}>
                      <p>{award.detail}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Contact */}
      <Section id="contact" className="bg-white/60">
        <Container>
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold uppercase mb-6">{t.contact.title}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3 text-sm">
                <p className="text-[#333]">{t.contact.p}</p>
                <div>✉️ <a className="underline hover:no-underline" href="mailto:ninamaslikova211003@gmail.com">ninamaslikova211003@gmail.com</a></div>
                <div>📞 <a className="underline hover:no-underline" href="tel:+79147756681">+7 (914) 775-66-81</a></div>
                <div>📍 St. Petersburg, Russia</div>
                <div>IG: <a className="underline hover:no-underline" target="_blank" rel="noreferrer" href="https://instagram.com/mm_ninona">@mm_ninona</a></div>
              </div>
              <form onSubmit={(e) => e.preventDefault()} className="border border-[#E5E5E5] rounded p-5 bg-white/80">
                <label className="block text-xs uppercase tracking-wide mb-1">{t.contact.form.name}</label>
                <input className="w-full border border-[#E5E5E5] rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#007AFF]" required />
                <label className="block text-xs uppercase tracking-wide mb-1">Email</label>
                <input type="email" className="w-full border border-[#E5E5E5] rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#007AFF]" required />
                <label className="block text-xs uppercase tracking-wide mb-1">{t.contact.form.message}</label>
                <textarea rows={4} className="w-full border border-[#E5E5E5] rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#007AFF]" required />
                <button className="uppercase text-xs font-semibold border-2 border-[#FF4500] text-[#FF4500] px-4 py-2 hover:bg-[#FF4500] hover:text-white transition">{t.contact.form.send}</button>
              </form>
            </div>
          </Reveal>
        </Container>
      </Section>

      <footer className="border-t border-[#E5E5E5] py-6 text-xs text-center text-[#666]">
        © {new Date().getFullYear()} NINA.MASLIKOVA — {t.footer}
      </footer>

      {/* Lightbox overlay */}
      <Lightbox images={resolvedProjectImages} index={lightboxIndex} onClose={close} onPrev={prev} onNext={next} />

      {/* Accessibility: reduced motion respect */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}

// ========= Translations
export function translate(lang: "ru" | "en") {
  if (lang === "en") {
    return {
      nav: { about: "About", projects: "Projects", skills: "Skills", awards: "Awards", contact: "Contact" },
      hero: {
        name: "An individual project for you",
        tagline:
          "I create vibrant spaces with attention to detail and personalized service. I manage projects from concept to final documentation.",
        viewWork: "View Projects",
        contact: "Contact",
      },
      about: {
        title: "About",
        p1: "Architect and drafter focused on thoughtful housing and interiors. I work with GOST & SP, prepare working drawings, and craft visuals that communicate design decisions.",
        p2: "Comfort with complex projects, tight deadlines, and clear communication with builders. I enjoy the calm logic of plans, sections, and details.",
        quick: { roleL: "Role", role: "Architect", locationL: "Location", langsL: "Languages", contactL: "Email" },
      },
      projects: {
        title: "Selected Projects",
        filters: ["All", "Residential", "Interior", "Working docs"],
        note: "Click any image to open it in a lightbox. Your own renders/photos can be plugged in easily.",
        cards: [
          {
            category: "Residential",
            title: "Sectional Residential Complex, Pushkin",
            desc: "11 sections, 4–5 floors on a stylobate with commercial ground floor.",
            meta: ["Site: 18,227 m²", "Height: 12–16 m", "Commercial 1st floor", "Brick + stone"],
          },
          {
            category: "Interior",
            title: "Apartment in a 1914 Monument House",
            desc: "Complete apartment project with layouts, finishes, and lighting schemes.",
            meta: ["Area: 80 m²", "Ceiling: 3.5 m", "Arched niche", "Marble-effect porcelain"],
          },
          {
            category: "Working docs",
            title: "Details & Nodes",
            desc: "Facade, roof nodes, cills, and floor build-ups prepared to GOST & SP.",
            meta: ["1:10–1:150", "Technonikol systems", "Cavity insulation", "Parapet & cill flashing"],
          },
        ],
      },
      skills: {
        title: "Skills & Software",
        items: [
          { name: "GOST & SP compliance", note: "Plans, sections, nodes", level: "Advanced" },
          { name: "3D modeling & viz", note: "SketchUp, 3ds Max", level: "Advanced" },
          { name: "Working documentation", note: "AR/AS sets", level: "Advanced" },
          { name: "Adobe suite", note: "Photoshop, InDesign", level: "Strong" },
          { name: "AutoCAD / ArchiCAD", note: "Daily driver", level: "Strong" },
          { name: "Client communication", note: "RU / EN", level: "Strong" },
        ],
      },
      awards: {
        title: "Awards & Recognition",
        items: [
          {
            title: "Regional Competition Winner",
            detail: "Implementation of a pergola in the urban square of the Leningrad region"
          },
          {
            title: "Training Center of Glavgosexpertiza Russia \"Expertise of the Future\" 2023-2024",
            detail: "Project \"Automation system for information requests about apartment buildings related to cultural heritage\""
          },
          {
            title: "II International Arch Debut Competition 2023",
            detail: "2nd place diploma in the \"Architecture\" category for the sectional residential complex project"
          },
          {
            title: "VI All-Russian Green Roofs Design Competition 2023",
            detail: "2nd place diploma in the \"Student Project\" category for the \"Children's Activity Center\" project"
          },
          {
            title: "II International Arch Debut Competition 2024",
            detail: "2nd place diploma in the Architecture category for the terraced house project"
          },
          {
            title: "Archseasons 2024",
            detail: "Finalist in the \"Residential Interior\" category"
          }
        ]
      },
      contact: {
        title: "Let’s Create Together",
        p: "Send a short brief and I will reply with first steps and timing.",
        form: { name: "Your name", message: "Message", send: "Send" },
      },
      footer: "Portfolio website",
    };
  }

  // RU default
  return {
    nav: { about: "Обо мне", projects: "Проекты", skills: "Навыки", awards: "Награды", contact: "Контакты" },
    hero: {
      name: "Индивидуальный проект под вас",
      tagline:
        "Создаю живые пространства с вниманием к вам и к деталям. Веду проекты от концепции до рабочей документации.",
      viewWork: "Смотреть проекты",
      contact: "Написать",
    },
    about: {
      title: "Обо мне",
      p1: "Архитектор и чертёжник, фокус на продуманном жилье и интерьерах. Работаю по ГОСТ и СП, готовлю рабочие чертежи и визуализации, которые ясно объясняют решения.",
      p2: "Уверенно веду сложные задачи и сроки, выстраиваю коммуникацию со строителями. Люблю спокойную логику планов, разрезов и узлов.",
      quick: { roleL: "Роль", role: "Архитектор", locationL: "Город", langsL: "Языки", contactL: "Почта" },
    },
    projects: {
      title: "Избранные проекты",
      filters: ["Все", "Жилые", "Интерьеры", "Рабочка"],
      cards: [
        {
          category: "Жилые",
          title: "Секционный жилой комплекс, Пушкин",
          desc: "11 секций, 4–5 этажей на стилобате, первый этаж — коммерция.",
          meta: ["Участок: 18 227 м²", "Высота: 12–16 м", "Коммерция 1 этаж", "Кирпич + камень"],
        },
        {
          category: "Интерьер",
          title: "Квартира в доме-памятнике 1914 года",
          desc: "Полный проект квартиры: планировки, отделка и световые схемы.",
          meta: ["Площадь: 80 м²", "Высота: 3,5 м", "Арочная ниша", "Керамогранит под мрамор"],
        },
        {
          category: "Рабочка",
          title: "Узлы и детали",
          desc: "Фасады, кровельные узлы, примыкания, пироги полов — по ГОСТ и СП.",
          meta: ["М1:10–1:150", "Технониколь", "Минвата", "Фартуки и отливы"],
        },
      ],
    },
    skills: {
      title: "Навыки и софт",
      items: [
        { name: "ГОСТ и СП", note: "Планы, разрезы, узлы", level: "Продвинуто" },
        { name: "3D и визуализации", note: "SketchUp, 3ds Max", level: "Продвинуто" },
        { name: "Рабочая документация", note: "АР/АС комплекты", level: "Продвинуто" },
        { name: "Adobe Suite", note: "Photoshop, InDesign", level: "Уверенно" },
        { name: "AutoCAD / ArchiCAD", note: "Ежедневно", level: "Уверенно" },
        { name: "Коммуникация с клиентами", note: "RU / EN", level: "Уверенно" },
      ],
    },
    awards: {
      title: "Награды и признание",
      items: [
        {
          title: "Победитель регионального конкурса",
          detail: "Реализация перклета на городской площади Ленинградской области"
        },
        {
          title: "Учебный центр Гавгосэкспертизы России \"Экспертиза будущего\" 2023-2024",
          detail: "Проект \"Система автоматизации запросов информации о МКД, относящихся к ОКН\""
        },
        {
          title: "II Международный конкурс Arch Debut 2023",
          detail: "Диплом 2-ой степени в номинации \"архитектура\" за проект секционного жилого комплекса"
        },
        {
          title: "VI Всероссийский конкурс дизайн-проектов зеленых крыш 2023",
          detail: "Диплом 2-ой степени в номинации \"студенческий проект\" за разработку проекта \"Детский досуговый центр\""
        },
        {
          title: "II Международный конкурс Arch Debut 2024",
          detail: "Диплом 2-ой степени в номинации архитектура за проект блокированного жилого дома"
        },
        {
          title: "Archseasons 2024",
          detail: "Финалист в номинации \"Жилой интерьер\""
        }
      ]
    },
    contact: {
      title: "Давайте создадим проект",
      p: "Пришлите небольшой бриф — отвечу первыми шагами и сроками.",
      form: { name: "Имя", message: "Сообщение", send: "Отправить" },
    },
    footer: "сайт-портфолио (превью)",
  };
}
