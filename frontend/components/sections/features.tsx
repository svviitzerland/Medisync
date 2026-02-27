import {
  BrainCircuitIcon,
  RefreshCwIcon,
  CalendarCheckIcon,
  PillIcon,
  LockIcon,
  NetworkIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const features = [
  {
    icon: BrainCircuitIcon,
    title: "AI Health Insights",
    description:
      "Our AI continuously analyzes your medical data to surface meaningful trends, early warnings, and personalized recommendations tailored to your health profile.",
    accent: "text-primary",
    bg: "bg-primary/8",
  },
  {
    icon: RefreshCwIcon,
    title: "Seamless Record Sync",
    description:
      "Instantly synchronize medical records, lab results, prescriptions, and imaging data across all your healthcare providers - always up to date.",
    accent: "text-blue-500",
    bg: "bg-blue-500/8",
  },
  {
    icon: CalendarCheckIcon,
    title: "Smart Appointments",
    description:
      "AI-optimized scheduling that coordinates between your providers, checks your availability, and sends reminders - zero back-and-forth.",
    accent: "text-green-500",
    bg: "bg-green-500/8",
  },
  {
    icon: PillIcon,
    title: "Medication Tracking",
    description:
      "Track all prescriptions, set smart reminders, detect potential drug interactions, and share adherence reports with your care team automatically.",
    accent: "text-orange-500",
    bg: "bg-orange-500/8",
  },
  {
    icon: LockIcon,
    title: "Secure & Private",
    description:
      "End-to-end encryption and full HIPAA compliance ensure your most sensitive health data is protected at every step - and always under your control.",
    accent: "text-purple-500",
    bg: "bg-purple-500/8",
  },
  {
    icon: NetworkIcon,
    title: "Multi-Provider Network",
    description:
      "Connect with hospitals, clinics, labs, specialists, and pharmacies across Indonesia in one unified platform - no more fragmented care.",
    accent: "text-rose-500",
    bg: "bg-rose-500/8",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="bg-muted/30"
      aria-labelledby="features-heading"
    >
      <div className="section-container section-padding">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-12 lg:mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            Features
          </p>
          <h2
            id="features-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Everything your healthcare needs,{" "}
            <span className="text-gradient-primary">in one place</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Medisync brings intelligence and simplicity to healthcare
            coordination - built for patients, designed for care teams.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-border/60 transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg}`}
                >
                  <feature.icon
                    className={`h-5 w-5 ${feature.accent}`}
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="text-base font-semibold">{feature.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
