import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeartPulseIcon, MenuIcon } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="section-container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
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
            <span className="text-foreground">
              Medi<span className="text-primary">sync</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="#get-started">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button (visual only - enhance with client component if needed) */}
          <button
            className="flex md:hidden items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
