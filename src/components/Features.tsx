import React from "react";

const features = [
  {
    title: "Modular",
    description: "Add or remove features as you need. NeoChyrp is built for composability.",
    icon: "🧩",
  },
  {
    title: "High Performance",
    description: "Server components and optimized data fetching for instant load times.",
    icon: "⚡",
  },
  {
    title: "Extensible",
    description: "Clear boundaries and APIs for future modules and integrations.",
    icon: "🔌",
  },
];

const Features: React.FC = () => (
  <section className="bg-gray-50 px-4 py-16">
    <h2 className="mb-8 text-center text-3xl font-bold">Why NeoChyrp?</h2>
    <div className="flex flex-col justify-center gap-8 md:flex-row">
      {features.map((feature) => (
        <div key={feature.title} className="flex w-full flex-col items-center rounded-lg bg-white p-6 shadow md:w-1/3">
          <div className="mb-4 text-4xl">{feature.icon}</div>
          <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
          <p className="text-center text-gray-600">{feature.description}</p>
        </div>
      ))}
    </div>
  </section>
);

export default Features;