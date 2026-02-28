import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Main wrapper for the modern 2-column or centered layout
 */
export function ViewLayout({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col lg:flex-row gap-8 items-start", className)}>
            {children}
        </div>
    );
}

/**
 * Left flex column wrapper
 */
export function ViewMain({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex-1 w-full mx-auto max-w-3xl space-y-6", className)}>
            {children}
        </div>
    );
}

/**
 * Standardized page header with title and description
 */
export function ViewHeader({
    title,
    description,
    children,
    className,
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4", className)}>
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                {description && (
                    <p className="mt-2 text-muted-foreground">{description}</p>
                )}
            </div>
            {children && <div>{children}</div>}
        </div>
    );
}

/**
 * Premium glassmorphism card wrapper for core forms and main content
 */
export function ViewContentCard({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("space-y-8 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-6 sm:p-8 shadow-sm", className)}>
            {children}
        </div>
    );
}

/**
 * Standardized section within a ViewContentCard
 */
export function ViewSection({
    step,
    title,
    children,
    className,
}: {
    step?: string | number;
    title: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center gap-3 border-b border-border/30 pb-3">
                {step && (
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {step}
                    </div>
                )}
                <h3 className="text-base font-semibold uppercase tracking-wider text-foreground">
                    {title}
                </h3>
            </div>
            {children}
        </div>
    );
}

/**
 * Sticky right-side column for queues and lists
 */
export function ViewSidebar({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("w-full lg:w-[400px] shrink-0 space-y-4 lg:sticky lg:top-4", className)}>
            {children}
        </div>
    );
}

/**
 * Reusable custom modal overlay component
 */
export function ViewModal({
    title,
    description,
    isOpen,
    onClose,
    icon,
    badge,
    children,
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    icon?: React.ReactNode;
    badge?: React.ReactNode;
    children: React.ReactNode;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl border border-border/50 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 slide-in-from-bottom-4">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 rounded-full p-2 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <X className="size-5" />
                </button>

                <div className="flex items-center gap-3 mb-6 pr-8">
                    {icon && (
                        <div className="bg-primary/10 p-3 rounded-2xl text-primary flex items-center justify-center shrink-0">
                            {icon}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                            {badge}
                        </div>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    {children}
                </div>

                <div className="mt-8">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="w-full h-12 rounded-xl text-base font-semibold"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
