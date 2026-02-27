const stats = [
  {
    value: "6",
    label: "Care Roles",
    description: "Patient, Front Office, Doctor, Nurse, Pharmacist, Admin",
  },
  {
    value: "AI",
    label: "Triage Engine",
    description: "Automated specialist matching & severity analysis",
  },
  {
    value: "100%",
    label: "Digital Workflow",
    description: "From ticket creation to prescription fulfillment",
  },
  {
    value: "One",
    label: "Unified Platform",
    description: "All roles, all data, all care stages in one place",
  },
];

export function StatsSection() {
  return (
    <section
      className="relative overflow-hidden"
      aria-labelledby="stats-heading"
    >
      {/* Background */}
      <div className="gradient-primary">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />

        <div className="relative py-16 section-container sm:py-20">
          <h2 id="stats-heading" className="sr-only">
            Medisync by the numbers
          </h2>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-semibold text-white/90">
                  {stat.label}
                </p>
                <p className="mt-1 text-xs text-white/65">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
