import Link from "next/link";
import { HeartPulseIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  Platform: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
  ],
  Account: [
    { label: "Sign In", href: "/login" },
    { label: "Sign Up", href: "/register" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="py-12 section-container lg:py-16">
        {/* Top section */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold"
              aria-label="Medisync Home"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg gradient-primary" aria-hidden="true">
                <HeartPulseIcon
                  className="w-4 h-4 text-white"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </span>
              <span>
                Medi<span className="text-primary">sync</span>
              </span>
            </Link>
            <p className="max-w-xs mt-4 text-sm leading-relaxed text-muted-foreground">
              AI-powered healthcare coordination connecting patients, doctors,
              nurses, and pharmacists in one unified platform.
            </p>
          </div>

          {/* Link Groups */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                {group}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-150 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
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
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Built with care for healthcare
          </p>
        </div>
      </div>
    </footer>
  );
}
