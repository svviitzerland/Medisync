import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, HeartPulseIcon } from "lucide-react";

export function CtaSection() {
  return (
    <section className="bg-background" aria-labelledby="cta-heading">
      <div className="section-container section-padding">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl gradient-primary px-8 py-16 text-center sm:px-12 sm:py-20 lg:px-16">
          {/* Decorative blobs */}
          <div
            className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />

          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <HeartPulseIcon className="h-7 w-7 text-white" strokeWidth={2} />
            </span>
          </div>

          {/* Heading */}
          <h2
            id="cta-heading"
            className="text-3xl font-bold text-white sm:text-4xl"
          >
            Ready to transform your healthcare experience?
          </h2>
          <p className="mt-4 text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
            Join thousands of patients and providers who trust Medisync to keep
            their health connected, intelligent, and secure.
          </p>

          {/* Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto gap-2 px-8 shadow-lg"
              asChild
            >
              <Link href="#get-started">
                Get Started Free
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto text-white hover:bg-white/15 hover:text-white border border-white/30 px-8"
              asChild
            >
              <Link href="#contact">Talk to Sales</Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-white/60">
            No credit card required - Free forever plan available - Cancel
            anytime
          </p>
        </div>
      </div>
    </section>
  );
}
