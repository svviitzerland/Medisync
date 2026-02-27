import { Card, CardContent } from "@/components/ui/card";
import { QuoteIcon } from "lucide-react";

const testimonials = [
  {
    quote:
      "I submitted my own ticket from home before I even arrived at the clinic. By the time I walked in, the doctor already had my symptoms and was ready for me. No forms, no waiting at the front desk.",
    name: "Siti Rahma",
    role: "Patient",
    location: "Jakarta",
    initial: "S",
  },
  {
    quote:
      "The AI\'s specialist recommendation is remarkably accurate. It surfaces the right doctor for each case before I even open the ticket. My consultations are more focused and my notes are instantly visible to the nurse and pharmacist.",
    name: "Dr. Andi Prasetyo",
    role: "Specialist Doctor",
    location: "Surabaya",
    initial: "A",
  },
  {
    quote:
      "Some patients arrive with a ticket already open from home; others we create one for on the spot. Either way the AI does the triage instantly and the queue moves twice as fast as before.",
    name: "Dewi Kusuma",
    role: "Front Office Staff",
    location: "Bandung",
    initial: "D",
  },
  {
    quote:
      "Digital prescriptions mean I receive the exact medication list the moment the doctor finalises the ticket. No illegible handwriting, no back-and-forth calls — just accurate, fast dispensing.",
    name: "Budi Santoso",
    role: "Pharmacist",
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
        <div className="max-w-2xl mx-auto mb-12 text-center lg:mb-16">
          <p className="mb-3 text-sm font-semibold tracking-widest uppercase text-primary">
            Testimonials
          </p>
          <h2
            id="testimonials-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Trusted by every role in{" "}
            <span className="text-gradient-primary">the care journey</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            From front office to pharmacy, here\'s how Medisync fits into real
            healthcare workflows.
          </p>
        </div>

        {/* Testimonial grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <Card
              key={t.name}
              className="transition-shadow border-border/60 hover:shadow-md"
            >
              <CardContent className="flex flex-col gap-4 pt-6">
                <QuoteIcon
                  className="w-6 h-6 text-primary/40"
                  strokeWidth={1.5}
                />
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-center text-sm font-semibold text-white rounded-full h-9 w-9 shrink-0 gradient-primary">
                    {t.initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{t.name}</p>
                    <p className="text-xs truncate text-muted-foreground">
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
