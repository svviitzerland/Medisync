"use client";

import * as React from "react";
import {
    ArrowRight,
    CheckCircle2,
    Loader2,
    RotateCcw,
    Send,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Demo data (no backend required) ─────────────────────────────────────────
const DEMO_COMPLAINT =
    "I've had a persistent headache for the past 3 days and feel some neck stiffness.";

const DEMO_QUESTIONS = [
    "Is the headache constant or does it come and go throughout the day?",
    "On a scale of 1–10, how would you rate the pain intensity right now?",
    "Have you experienced any fever, nausea, or sensitivity to light along with the headache?",
];

const DEMO_RESULT = {
    ai_summary:
        "Based on your responses, your symptoms are consistent with a tension-type headache, possibly compounded by posture-related neck strain. The duration and neck stiffness warrant a clinical evaluation to rule out secondary causes. Rest, hydration, and over-the-counter analgesics may provide short-term relief.",
    suggested_doctor_id: "demo-doctor-001",
};
// ─────────────────────────────────────────────────────────────────────────────

export function HealthCheckPreview() {
    const [complaint, setComplaint] = React.useState("");
    const [hcLoading, setHcLoading] = React.useState(false);
    const [hcError, setHcError] = React.useState<string | null>(null);
    const [hcPhase, setHcPhase] = React.useState<
        "initial" | "questions" | "submitting" | "result"
    >("initial");
    const [questions, setQuestions] = React.useState<string[]>([]);
    const [answers, setAnswers] = React.useState<string[]>([]);
    const [currentQ, setCurrentQ] = React.useState(0);
    const [result, setResult] = React.useState<typeof DEMO_RESULT | null>(null);
    const answerRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        if (hcPhase === "questions") {
            answerRef.current?.focus();
        }
    }, [currentQ, hcPhase]);

    // ── Handlers (demo mode: simulate API delay) ─────────────────────────────
    async function handleComplaintSubmit() {
        if (!complaint.trim() || hcLoading) return;
        setHcLoading(true);
        setHcError(null);
        await new Promise((r) => setTimeout(r, 900));
        setQuestions(DEMO_QUESTIONS);
        setAnswers(new Array(DEMO_QUESTIONS.length).fill(""));
        setCurrentQ(0);
        setHcPhase("questions");
        setHcLoading(false);
    }

    async function handleAnswerNext() {
        if (!answers[currentQ]?.trim()) return;
        if (currentQ < questions.length - 1) {
            setCurrentQ((prev) => prev + 1);
        } else {
            setHcPhase("submitting");
            setHcError(null);
            await new Promise((r) => setTimeout(r, 1200));
            setResult(DEMO_RESULT);
            setHcPhase("result");
        }
    }

    function handleReset() {
        setComplaint("");
        setQuestions([]);
        setAnswers([]);
        setCurrentQ(0);
        setHcPhase("initial");
        setHcError(null);
        setResult(null);
    }

    function handleUseDemoData() {
        setComplaint(DEMO_COMPLAINT);
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto px-4 py-8 min-h-105">
            {/* Step 1: Initial complaint */}
            {hcPhase === "initial" && (
                <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-2 text-center">
                        <div className="flex items-center justify-center gap-2 text-primary mb-4">
                            <Sparkles className="size-5" />
                            <span className="text-xs font-medium uppercase tracking-widest">
                                AI Health Check
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            What do you feel today?
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Describe your symptoms or health concerns. Our AI Orchestrator
                            will ask a few follow-up questions to better understand your
                            condition.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <textarea
                            value={complaint}
                            onChange={(e) => setComplaint(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleComplaintSubmit();
                                }
                            }}
                            placeholder="e.g. I've had a persistent headache for the past 3 days..."
                            rows={4}
                            disabled={hcLoading}
                            className="w-full resize-none rounded-xl border border-border/60 bg-card px-4 py-3.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                            autoFocus
                        />

                        {hcError && (
                            <p className="text-sm text-destructive text-center">{hcError}</p>
                        )}

                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={handleComplaintSubmit}
                                disabled={hcLoading || !complaint.trim()}
                                className="w-full gap-2 h-11 rounded-xl"
                                size="lg"
                            >
                                {hcLoading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={handleUseDemoData}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
                            >
                                Try with demo data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Follow-up questions (one at a time) */}
            {hcPhase === "questions" && (
                <div
                    key={currentQ}
                    className="w-full space-y-8 animate-in fade-in slide-in-from-right-8 duration-400"
                >
                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                                Question {currentQ + 1} of {questions.length}
                            </span>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                                <RotateCcw className="size-3" />
                                Start over
                            </button>
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                                style={{
                                    width: `${((currentQ + 1) / questions.length) * 100}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Question */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold leading-relaxed">
                            {questions[currentQ]}
                        </h3>

                        <textarea
                            ref={answerRef}
                            value={answers[currentQ] ?? ""}
                            onChange={(e) => {
                                const updated = [...answers];
                                updated[currentQ] = e.target.value;
                                setAnswers(updated);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAnswerNext();
                                }
                            }}
                            placeholder="Type your answer..."
                            rows={3}
                            className="w-full resize-none rounded-xl border border-border/60 bg-card px-4 py-3.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                        />

                        {hcError && <p className="text-sm text-destructive">{hcError}</p>}

                        <Button
                            onClick={handleAnswerNext}
                            disabled={!answers[currentQ]?.trim()}
                            className="w-full gap-2 h-11 rounded-xl"
                            size="lg"
                        >
                            {currentQ < questions.length - 1 ? (
                                <>
                                    Next
                                    <ArrowRight className="size-4" />
                                </>
                            ) : (
                                <>
                                    <Send className="size-4" />
                                    Submit Assessment
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Answered summary (collapsed) */}
                    {currentQ > 0 && (
                        <div className="space-y-2 pt-4 border-t border-border/30">
                            <p className="text-xs text-muted-foreground font-medium">
                                Previous answers
                            </p>
                            {questions.slice(0, currentQ).map((q, i) => (
                                <div
                                    key={i}
                                    className="rounded-lg bg-muted/30 border border-border/20 p-3 space-y-1"
                                >
                                    <p className="text-xs text-muted-foreground">{q}</p>
                                    <p className="text-sm">{answers[i]}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2.5: Submitting */}
            {hcPhase === "submitting" && (
                <div className="w-full flex flex-col items-center gap-4 py-12 animate-in fade-in duration-300">
                    <Loader2 className="size-8 text-primary animate-spin" />
                    <div className="text-center space-y-1">
                        <p className="font-medium">Analyzing your responses</p>
                        <p className="text-sm text-muted-foreground">
                            This may take a moment...
                        </p>
                    </div>
                </div>
            )}

            {/* Step 3: Result */}
            {hcPhase === "result" && result && (
                <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
                            <CheckCircle2 className="size-5 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Assessment Complete</h2>
                            <p className="text-sm text-muted-foreground">
                                Here is your AI-generated health summary
                            </p>
                        </div>
                    </div>

                    {/* Summary card */}
                    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                Summary
                            </p>
                            <p className="text-sm leading-relaxed">
                                {result.ai_summary || "No summary available."}
                            </p>
                        </div>

                        {result.suggested_doctor_id && (
                            <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/15 px-3 py-2.5 text-sm">
                                <CheckCircle2 className="size-4 text-primary shrink-0" />
                                <span>
                                    A doctor has been recommended for your case. Please visit the
                                    hospital for further examination.
                                </span>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        This is an AI-generated preliminary assessment and should not
                        replace professional medical advice.
                    </p>

                    <Button
                        onClick={handleReset}
                        variant="outline"
                        className="w-full gap-2 h-11 rounded-xl"
                        size="lg"
                    >
                        <RotateCcw className="size-4" />
                        Start New Check
                    </Button>
                </div>
            )}
        </div>
    );
}