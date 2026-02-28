import { UserPlusIcon, ClipboardPlusIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    number: "01",
    icon: UserPlusIcon,
    title: "Describe Your Symptoms",
    description:
      "From your patient dashboard, fill in the AI Health Check form. Describe your symptoms, how long you've had them, and any relevant personal details. No medical jargon required.",
  },
  {
    number: "02",
    icon: SparklesIcon,
    title: "AI Orchestrator Takes Over",
    description:
      "Medisync's AI Orchestrator instantly analyzes your symptoms, assigns a severity level, suggests the right specialist, and opens a ticket with full clinical notes, all before you ever see a doctor.",
  },
  {
    number: "03",
    icon: ClipboardPlusIcon,
    title: "Doctor Reviews & Prescribes",
    description:
      "Your matched doctor receives the AI pre-assessment, reviews your case, and issues a prescription digitally. Nursing and pharmacy are notified automatically with no phone calls and no paperwork.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="bg-background"
      aria-labelledby="hiw-heading"
    >
      <div className="section-container section-padding">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-12 text-center lg:mb-16">
          <p className="mb-3 text-sm font-semibold tracking-widest uppercase text-primary">
            How It Works
          </p>
          <h2
            id="hiw-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            From symptoms to specialist,{" "}
            <span className="text-gradient-primary">in minutes</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Medisync&apos;s AI Orchestrator handles triage and routing the
            moment you describe your symptoms with no manual handoffs, no lost
            information, no waiting.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div
            className="absolute left-1/2 top-10 hidden h-0.5 w-2/3 -translate-x-1/2 bg-linear-to-r from-transparent via-border to-transparent lg:block"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center"
              >
                {/* Number badge */}
                <div className="relative mb-6">
                  <div className="flex items-center justify-center w-20 h-20 shadow-lg rounded-2xl gradient-primary shadow-primary/20">
                    <step.icon
                      className="w-8 h-8 text-white"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </div>
                  <Badge
                    variant="secondary"
                    className="absolute flex items-center justify-center w-6 h-6 p-0 text-xs font-bold rounded-full -top-2 -right-2"
                  >
                    {step.number}
                  </Badge>
                </div>

                <h3 className="mb-3 text-lg font-semibold">{step.title}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
