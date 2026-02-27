import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, HeartPulseIcon } from "lucide-react";

export function CtaSection() {
  return (
    <section className="bg-background" aria-labelledby="cta-heading">
      <div className="section-container section-padding">
        <div className="relative max-w-4xl px-8 py-16 mx-auto overflow-hidden text-center rounded-3xl gradient-primary sm:px-12 sm:py-20 lg:px-16">
          {/* Decorative blobs */}
          <div
            className="absolute w-48 h-48 rounded-full pointer-events-none -top-12 -right-12 bg-white/10 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="absolute w-48 h-48 rounded-full pointer-events-none -bottom-12 -left-12 bg-white/10 blur-2xl"
            aria-hidden="true"
          />

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <span className="flex items-center justify-center h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm">
              <HeartPulseIcon className="text-white h-7 w-7" strokeWidth={2} />
            </span>
          </div>

          {/* Heading */}
          <h2
            id="cta-heading"
            className="text-3xl font-bold text-white sm:text-4xl"
          >
            Ready to transform your healthcare experience?
          </h2>
          <p className="max-w-xl mx-auto mt-4 text-lg leading-relaxed text-white/80">
            Join thousands of patients and providers who trust Medisync to keep
            their health connected, intelligent, and secure.
          </p>

          {/* Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 mt-10 sm:flex-row">
            <Button
              size="lg"
              className="w-full gap-2 px-8 bg-white shadow-lg text-primary hover:bg-white/90 sm:w-auto"
              asChild
            >
              <Link href="#get-started">
                Get Started Free
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full px-8 text-white border sm:w-auto hover:bg-white/15 hover:text-white border-white/30"
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
