import { UserPlusIcon, RefreshCcwDotIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    number: "01",
    icon: UserPlusIcon,
    title: "Create Your Profile",
    description:
      "Sign up in minutes. Connect your existing healthcare providers, input your medical history, and grant secure access to your care team.",
  },
  {
    number: "02",
    icon: RefreshCcwDotIcon,
    title: "Sync Your Records",
    description:
      "Medisync automatically pulls and harmonizes data from hospitals, labs, clinics, and pharmacies - keeping everything current without any manual effort.",
  },
  {
    number: "03",
    icon: SparklesIcon,
    title: "Get AI-Powered Insights",
    description:
      "Our AI engine analyzes your unified health data to deliver actionable recommendations, flag anomalies early, and help you have more informed conversations with your doctors.",
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
        <div className="mx-auto max-w-2xl text-center mb-12 lg:mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            How It Works
          </p>
          <h2
            id="hiw-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Up and running{" "}
            <span className="text-gradient-primary">in three steps</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Getting started with Medisync is simple. No complex setup, no
            integration headaches - just seamless healthcare from day one.
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
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/20">
                    <step.icon
                      className="h-8 w-8 text-white"
                      strokeWidth={1.75}
                    />
                  </div>
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                  >
                    {step.number}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
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
