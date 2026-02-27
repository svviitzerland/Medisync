import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  ZapIcon,
  UsersIcon,
} from "lucide-react";

const trustBadges = [
  { icon: ShieldCheckIcon, label: "HIPAA Compliant" },
  { icon: ZapIcon, label: "99.9% Uptime" },
  { icon: UsersIcon, label: "10k+ Patients" },
];

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-background"
      aria-labelledby="hero-heading"
    >
      {/* Background decoration */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute top-0 right-0 h-150 w-150 translate-x-1/3 -translate-y-1/4 rounded-full opacity-[0.07] gradient-primary blur-3xl" />
        <div className="absolute bottom-0 left-0 h-100 w-100 -translate-x-1/4 translate-y-1/4 rounded-full bg-primary/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, oklch(0.60 0.10 185) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="section-container section-padding">
        <div className="mx-auto max-w-4xl text-center">
          {/* Announcement badge */}
          <div className="mb-6 flex justify-center">
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 text-xs font-medium gap-1.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
              Introducing AI-Powered Health Sync
              <ArrowRightIcon className="h-3 w-3" />
            </Badge>
          </div>

          {/* Heading */}
          <h1
            id="hero-heading"
            className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Your Health,{" "}
            <span className="text-gradient-primary">Seamlessly</span> Connected
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl max-w-2xl mx-auto">
            Medisync unifies your medical records across all providers, delivers
            AI-driven health insights, and keeps your entire care team in sync —
            so you can focus on what matters most: your wellbeing.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto gap-2 px-8" asChild>
              <Link href="#get-started">
                Get Started Free
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto gap-2 px-8"
              asChild
            >
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual / Dashboard mockup */}
        <div className="mt-16 sm:mt-20">
          <div className="relative mx-auto max-w-5xl">
            {/* Outer glow ring */}
            <div className="absolute -inset-1 rounded-2xl gradient-primary opacity-20 blur-xl" />
            {/* Dashboard card */}
            <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-destructive/60" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400/60" />
                  <span className="h-3 w-3 rounded-full bg-green-400/60" />
                </div>
                <div className="mx-auto flex h-6 w-64 items-center rounded-md bg-muted px-3">
                  <span className="text-xs text-muted-foreground">
                    app.medisync.id
                  </span>
                </div>
              </div>

              {/* Dashboard content mockup */}
              <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
                {/* Stats cards */}
                {[
                  {
                    label: "Health Score",
                    value: "94",
                    unit: "/100",
                    color: "text-primary",
                  },
                  {
                    label: "Active Providers",
                    value: "3",
                    unit: " synced",
                    color: "text-green-500",
                  },
                  {
                    label: "Next Appointment",
                    value: "Feb 28",
                    unit: "",
                    color: "text-foreground",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-border/60 bg-background p-4"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                      <span className="text-sm font-normal text-muted-foreground">
                        {stat.unit}
                      </span>
                    </p>
                  </div>
                ))}

                {/* Activity Feed */}
                <div className="sm:col-span-2 rounded-xl border border-border/60 bg-background p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Recent Activity
                  </p>
                  <div className="space-y-3">
                    {[
                      {
                        text: "Blood test results synced from Lab Core",
                        time: "2m ago",
                        dot: "bg-primary",
                      },
                      {
                        text: "Prescription updated by Dr. Wirawan",
                        time: "1h ago",
                        dot: "bg-green-500",
                      },
                      {
                        text: "AI detected elevated glucose trend",
                        time: "3h ago",
                        dot: "bg-yellow-500",
                      },
                    ].map((item) => (
                      <div key={item.text} className="flex items-start gap-3">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.dot}`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-foreground leading-snug">
                            {item.text}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insight card */}
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
                    AI Insight
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    Your cardiovascular indicators are improving. Keep up the
                    current activity levels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
