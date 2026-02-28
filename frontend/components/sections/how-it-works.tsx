import { UserPlusIcon, ClipboardPlusIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    number: "01",
    icon: UserPlusIcon,
    title: "Sign Up as a Patient",
    description:
      "Create your patient account in minutes. Provide your basic profile information and you're ready to access Medisync's full care coordination platform.",
  },
  {
    number: "02",
    icon: ClipboardPlusIcon,
    title: "Open a Ticket — Your Way",
    description:
      "Submit a health ticket yourself directly from your patient dashboard, or have front office staff create one for you when you arrive at the clinic. Either way, the AI immediately analyzes urgency and routes you to the right specialist.",
  },
  {
    number: "03",
    icon: SparklesIcon,
    title: "AI Routes You to the Right Doctor",
    description:
      "Your ticket is automatically assigned to the best-matched doctor. They review it, add their notes and prescription, and hand off to nursing or pharmacy — all within the platform.",
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
            From check-in to prescription,{" "}
            <span className="text-gradient-primary">fully coordinated</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Medisync handles the entire patient journey — no manual handoffs, no
            lost information, no waiting for someone to make a call.
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
