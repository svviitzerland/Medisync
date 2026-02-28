import {
  BrainCircuitIcon,
  ClipboardListIcon,
  StethoscopeIcon,
  PillIcon,
  SparklesIcon,
  LayoutDashboardIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const features = [
  {
    icon: BrainCircuitIcon,
    title: "AI Self Health Check",
    description:
      "Patients describe their symptoms from home and receive an instant AI pre-assessment covering severity level, suggested specialist, and clinical notes, before a doctor ever opens the ticket.",
    accent: "text-primary",
    bg: "bg-primary/8",
  },
  {
    icon: SparklesIcon,
    title: "AI Orchestrator",
    description:
      "The AI Orchestrator is the central brain of Medisync. It coordinates pre-assessment, severity triage, specialist routing, and care handoffs across every role, automatically and in real time.",
    accent: "text-violet-500",
    bg: "bg-violet-500/8",
  },
  {
    icon: ClipboardListIcon,
    title: "Health Ticket System",
    description:
      "Patients open a ticket themselves from the self-service dashboard, or front office staff can create one on arrival. Every ticket is tracked from intake through consultation, nursing care, and pharmacy fulfillment.",
    accent: "text-blue-500",
    bg: "bg-blue-500/8",
  },
  {
    icon: StethoscopeIcon,
    title: "Doctor & Specialist Matching",
    description:
      "AI automatically assigns the right doctor or specialist to each ticket based on pre-assessment results, availability, and specialization. No manual coordination needed.",
    accent: "text-green-500",
    bg: "bg-green-500/8",
  },
  {
    icon: PillIcon,
    title: "Digital Prescription Flow",
    description:
      "Doctors issue prescriptions digitally within the platform. Pharmacists receive and process them in real time, eliminating paper workflows and reducing dispensing errors.",
    accent: "text-orange-500",
    bg: "bg-orange-500/8",
  },
  {
    icon: LayoutDashboardIcon,
    title: "Real-Time Status Tracking",
    description:
      "Patients and staff monitor ticket progress at every stage, from AI pre-assessment and check-in to diagnosis, nursing care, and prescription pickup, all in one unified view.",
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
        <div className="max-w-2xl mx-auto mb-12 text-center lg:mb-16">
          <p className="mb-3 text-sm font-semibold tracking-widest uppercase text-primary">
            Features
          </p>
          <h2
            id="features-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            AI health check,{" "}
            <span className="text-gradient-primary">built for every role</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            From patient self-assessment to doctor consultation and pharmacy
            fulfillment, Medisync's AI engine powers every step of your care
            journey.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="relative overflow-hidden group border-border/60 transition-shadow duration-200 hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg}`}
                >
                  <feature.icon
                    className={`h-5 w-5 ${feature.accent}`}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-base font-semibold">{feature.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
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
