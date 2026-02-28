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
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="section-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md"
              aria-label="Medisync Home"
            >
              <span
                className="flex items-center justify-center w-8 h-8 rounded-lg gradient-primary"
                aria-hidden="true"
              >
                <HeartPulseIcon
                  className="w-4 h-4 text-white"
                  strokeWidth={2.5}
                  aria-hidden="true"
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
                  className="text-sm transition-colors duration-150 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth actions */}
            <div className="items-center hidden gap-3 md:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>

            {/* Mobile menu button — upgrade to client component for full interactivity */}
            <button
              type="button"
              className="flex items-center justify-center p-2 rounded-md md:hidden text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label="Open main menu"
              aria-expanded="false"
              aria-controls="mobile-menu"
            >
              <MenuIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
