import { Card, CardContent } from "@/components/ui/card";
import { QuoteIcon } from "lucide-react";

const testimonials = [
  {
    quote:
      "Before Medisync, I had to carry physical folders to every specialist. Now my entire history is there when I need it - even my new cardiologist could see my blood work from last year instantly.",
    name: "Siti Rahma",
    role: "Patient",
    location: "Jakarta",
    initial: "S",
  },
  {
    quote:
      "The AI flagged a pattern in a patient's glucose readings that we might have missed for another few months. That early detection genuinely changed the treatment plan. This tool is remarkable.",
    name: "Dr. Andi Prasetyo",
    role: "General Practitioner",
    location: "Surabaya",
    initial: "A",
  },
  {
    quote:
      "Integrating Medisync into our clinic workflow reduced administrative overhead by nearly 40%. Our staff spends less time chasing records and more time with patients.",
    name: "Dewi Kusuma",
    role: "Clinic Administrator",
    location: "Bandung",
    initial: "D",
  },
  {
    quote:
      "Managing my elderly mother's care across three hospitals used to be an exhausting juggle. Medisync gave us one place to see everything - and the medication reminders are a lifesaver.",
    name: "Budi Santoso",
    role: "Family Caregiver",
    location: "Yogyakarta",
    initial: "B",
  },
];

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="bg-muted/30"
      aria-labelledby="testimonials-heading"
    >
      <div className="section-container section-padding">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-12 lg:mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            Testimonials
          </p>
          <h2
            id="testimonials-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Trusted by patients and{" "}
            <span className="text-gradient-primary">care teams alike</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Real stories from the people who use Medisync every day.
          </p>
        </div>

        {/* Testimonial grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <Card
              key={t.name}
              className="border-border/60 transition-shadow hover:shadow-md"
            >
              <CardContent className="flex flex-col gap-4 pt-6">
                <QuoteIcon
                  className="h-6 w-6 text-primary/40"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-border/60">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-primary text-white text-sm font-semibold">
                    {t.initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.role} - {t.location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
