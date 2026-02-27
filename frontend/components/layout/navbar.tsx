import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeartPulseIcon, MenuIcon } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold"
            aria-label="Medisync Home"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg gradient-primary">
              <HeartPulseIcon
                className="w-4 h-4 text-white"
                strokeWidth={2.5}
              />
            </span>
            <span className="text-foreground">
              Medi<span className="text-primary">sync</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav
            className="items-center hidden gap-6 md:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-colors text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="items-center hidden gap-3 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>

          {/* Mobile Menu Button (visual only - enhance with client component if needed) */}
          <button
            className="flex items-center justify-center p-2 rounded-md md:hidden text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Open menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
