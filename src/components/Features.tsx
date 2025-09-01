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
  <section className="py-16 px-4 bg-gray-50">
    <h2 className="text-3xl font-bold text-center mb-8">Why NeoChyrp?</h2>
    <div className="flex flex-col md:flex-row justify-center gap-8">
      {features.map((feature) => (
        <div key={feature.title} className="flex flex-col items-center bg-white rounded-lg shadow p-6 w-full md:w-1/3">
          <div className="text-4xl mb-4">{feature.icon}</div>
          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
          <p className="text-gray-600 text-center">{feature.description}</p>
        </div>
      ))}
    </div>
  </section>
);

export default Features;