import Link from "next/link";
import { HeartPulseIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Security", href: "#security" },
  ],
  Healthcare: [
    { label: "For Patients", href: "#patients" },
    { label: "For Providers", href: "#providers" },
    { label: "For Hospitals", href: "#hospitals" },
    { label: "Integrations", href: "#integrations" },
  ],
  Company: [
    { label: "About Us", href: "#about" },
    { label: "Blog", href: "#blog" },
    { label: "Careers", href: "#careers" },
    { label: "Contact", href: "#contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Terms of Service", href: "#terms" },
    { label: "HIPAA Compliance", href: "#hipaa" },
    { label: "Cookie Policy", href: "#cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="section-container py-12 lg:py-16">
        {/* Top section */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-5 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-lg"
              aria-label="Medisync Home"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <HeartPulseIcon
                  className="h-4 w-4 text-white"
                  strokeWidth={2.5}
                />
              </span>
              <span>
                Medi<span className="text-primary">sync</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-powered healthcare synchronization that connects patients and
              providers seamlessly.
            </p>
          </div>

          {/* Link Groups */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {group}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom section */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Medisync. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Built with care for healthcare
          </p>
        </div>
      </div>
    </footer>
  );
}
