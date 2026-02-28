import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import { HealthCheckPreview } from "@/components/sections/health-check-preview";

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-background"
      aria-labelledby="hero-heading"
    >
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        aria-hidden="true"
      >
        <div className="absolute top-0 right-0 h-150 w-150 translate-x-1/3 -translate-y-1/4 rounded-full opacity-[0.07] gradient-primary blur-3xl" />
        <div className="absolute bottom-0 left-0 rounded-full h-100 w-100 -translate-x-1/4 translate-y-1/4 bg-primary/10 blur-3xl" />
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
        <div className="max-w-4xl mx-auto text-center">
          {/* Announcement badge */}
          <div className="flex justify-center mb-6">
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 text-xs font-medium gap-1.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
              Powered by the AI Orchestrator
              <ArrowRightIcon className="w-3 h-3" />
            </Badge>
          </div>

          {/* Heading */}
          <h1
            id="hero-heading"
            className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Check Your Symptoms{" "}
            <span className="text-gradient-primary">with AI</span>, Before You
            Visit
          </h1>

          {/* Subtext */}
          <p className="max-w-2xl mx-auto mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Describe your symptoms from home. Medisync&apos;s AI Orchestrator
            pre-assesses your condition, determines urgency, and routes you to
            the right specialist, so your doctor is fully briefed before you
            even walk in.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 mt-10 sm:flex-row">
            <Button size="lg" className="w-full gap-2 px-8 sm:w-auto" asChild>
              <Link href="/register">
                Start Health Check
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2 px-8 sm:w-auto"
              asChild
            >
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>
        </div>

        {/* AI Health Check mockup */}
        <div className="mt-16 sm:mt-20">
          <div className="relative max-w-5xl mx-auto">
            {/* Outer glow ring */}
            <div className="absolute -inset-1 rounded-2xl gradient-primary opacity-20 blur-xl" />
            {/* App card */}
            <div className="relative overflow-hidden border shadow-2xl rounded-2xl border-border/60 bg-card">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/30">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-destructive/60" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400/60" />
                  <span className="w-3 h-3 rounded-full bg-green-400/60" />
                </div>
                <div className="flex items-center w-64 h-6 px-3 mx-auto rounded-md bg-muted">
                  <span className="text-xs text-muted-foreground">
                    app.medisync.id/health-check
                  </span>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex items-center gap-1 px-6 pt-4 border-b border-border/60">
                <button className="px-4 py-2 text-xs font-semibold border-b-2 rounded-t-lg text-primary border-primary bg-primary/5">
                  AI Health Check
                </button>
                <button className="px-4 py-2 text-xs text-muted-foreground">
                  My Tickets
                </button>
                <button className="px-4 py-2 text-xs text-muted-foreground">
                  History
                </button>
              </div>

              {/* Live Health Check component */}
              <HealthCheckPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}