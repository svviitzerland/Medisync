import {
  BrainCircuitIcon,
  ClipboardListIcon,
  StethoscopeIcon,
  PillIcon,
  UsersIcon,
  LayoutDashboardIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const features = [
  {
    icon: BrainCircuitIcon,
    title: "AI-Powered Triage",
    description:
      "Our AI analyzes patient-reported symptoms and medical history to determine severity and recommend the most suitable specialist, reducing wait times and improving care outcomes.",
    accent: "text-primary",
    bg: "bg-primary/8",
  },
  {
    icon: ClipboardListIcon,
    title: "Health Ticket System",
    description:
      "Patients can open a ticket themselves from their dashboard, or front office staff can create one on their behalf at check-in. Every ticket is tracked from intake through doctor consultation, nursing care, and pharmacy fulfillment.",
    accent: "text-blue-500",
    bg: "bg-blue-500/8",
  },
  {
    icon: StethoscopeIcon,
    title: "Doctor & Specialist Matching",
    description:
      "AI automatically assigns the right doctor or specialist to each ticket based on symptom analysis, availability, and specialization — no manual coordination needed.",
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
    icon: UsersIcon,
    title: "Multi-Role Care Coordination",
    description:
      "Purpose-built dashboards for every role: Patient, Front Office, Doctor, Nurse, Pharmacist, and Admin — each with the right tools and visibility for their part of the care journey.",
    accent: "text-purple-500",
    bg: "bg-purple-500/8",
  },
  {
    icon: LayoutDashboardIcon,
    title: "Real-Time Status Tracking",
    description:
      "Patients and staff can monitor ticket progress at every stage — from check-in and triage to diagnosis, inpatient care, and prescription pickup — all in one unified view.",
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
            Everything your care team needs,{" "}
            <span className="text-gradient-primary">in one platform</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Medisync brings AI intelligence and role-based workflows together so
            patients, doctors, nurses, and pharmacists always have the right
            information at the right time.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="relative overflow-hidden transition-shadow group border-border/60 hover:shadow-md"
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
