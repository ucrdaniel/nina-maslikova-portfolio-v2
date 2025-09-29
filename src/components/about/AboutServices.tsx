/* eslint-disable @typescript-eslint/no-explicit-any */
interface Service {
  title: string;
  description: string;
}

interface AboutServicesProps {
  services: Service[];
}

export default function AboutServices({ services }: AboutServicesProps) {
  return (
    <section className="mt-10 grid grid-cols-1 gap-8 rounded-2xl bg-white/70 backdrop-blur-sm text-[#1A1A1A] border border-[#E5E5E5] px-6 py-10 sm:px-8 md:px-12 lg:grid-cols-3">
      {services.map((service, i) => (
        <div key={i}>
          <h3 className="text-xl font-medium uppercase">{service.title}</h3>
          <p className="mt-3 text-sm text-[#666] leading-relaxed">{service.description}</p>
        </div>
      ))}
    </section>
  );
}
