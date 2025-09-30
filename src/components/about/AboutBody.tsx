/* eslint-disable @typescript-eslint/no-explicit-any */
import CountUp from "../motions/CountUp";

interface AboutBodyProps {
  sectionTitle: string;
  p1: string;
  p2: string;
  stats: {
    years: string;
    projects: string;
    clients: string;
  };
}

export default function AboutBody({ sectionTitle, p1, p2, stats }: AboutBodyProps) {
  return (
    <section id="about-body" className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm text-[#1A1A1A] border border-[#E5E5E5]">
      {/* optional subtle highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] select-none"
        style={{ background: "radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 60%)" }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[640px]">
        {/* LEFT — copy + stats */}
        <div className="flex flex-col h-full px-6 py-16 sm:px-8 md:px-12 lg:py-20">
          <div className="flex-grow">
            {/* Section heading moved inside the card */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold uppercase mb-8">{sectionTitle}</h2>
            
            <p className="text-lg leading-relaxed text-[#333]">
              {p1}
            </p>

            <p className="mt-6 text-base leading-relaxed text-[#666]">
              {p2}
            </p>
          </div>

          {/* Stats pushed to the bottom with mt-auto */}
          <dl className="mt-auto pt-12 grid grid-cols-3 gap-6 sm:gap-8">
            <div>
              <dt className="sr-only">Years of experience</dt>
              <dd className="text-4xl font-semibold tracking-tight tabular-nums">
                <span className="inline-flex items-baseline gap-1">
                  <CountUp to={5} duration={1.1} />
                  <span aria-hidden className="text-3xl">+</span>
                </span>
                <span className="block mt-2 text-sm font-normal text-[#666]">{stats.years}</span>
              </dd>
            </div>

            <div>
              <dt className="sr-only">Completed projects</dt>
              <dd className="text-4xl font-semibold tracking-tight tabular-nums">
                <CountUp to={13} duration={1.1} />
                <span className="block mt-2 text-sm font-normal text-[#666]">{stats.projects}</span>
              </dd>
            </div>

            <div>
              <dt className="sr-only">Happy clients</dt>
              <dd className="text-4xl font-semibold tracking-tight tabular-nums">
                <span className="inline-flex items-baseline">
                  <CountUp to={100} duration={1.1} />
                  <span aria-hidden className="text-3xl">%</span>
                </span>
                <span className="block mt-2 text-sm font-normal text-[#666]">{stats.clients}</span>
              </dd>
            </div>
          </dl>
        </div>

        {/* RIGHT — image */}
        <figure className="relative h-full overflow-hidden rounded-r-2xl">
          <img 
            src="/images/about-portrait.png" 
            alt="Nina Maslikova portrait" 
            className="absolute inset-0 h-full w-full object-cover" 
            loading="lazy" 
          />
        </figure>
      </div>
    </section>
  );
}
