import { useEffect, useState } from "react";
import { Globe, Package, Brain, Mic, CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  icon: React.ReactNode;
  duration: number;
}

const steps: Step[] = [
  { label: "Scanning website…", icon: <Globe className="w-5 h-5" />, duration: 3000 },
  { label: "Discovering products…", icon: <Package className="w-5 h-5" />, duration: 5000 },
  { label: "Building concierge personality…", icon: <Brain className="w-5 h-5" />, duration: 6000 },
  { label: "Creating voice agent…", icon: <Mic className="w-5 h-5" />, duration: 4000 },
];

interface GenerationProgressProps {
  isActive: boolean;
  isComplete?: boolean;
}

const GenerationProgress = ({ isActive, isComplete }: GenerationProgressProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;

    const advance = (step: number) => {
      if (step >= steps.length - 1) return;
      timeout = setTimeout(() => {
        setCurrentStep(step + 1);
        advance(step + 1);
      }, steps[step].duration);
    };

    advance(0);
    return () => clearTimeout(timeout);
  }, [isActive]);

  if (!isActive) return null;

  // Completion state
  if (isComplete) {
    return (
      <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in text-center">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-scale-in">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-display font-semibold text-foreground">Pilot ready!</p>
          <p className="text-sm text-muted-foreground font-body">Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
      {/* Animated waveform */}
      <div className="flex items-center justify-center gap-1 h-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-primary rounded-full animate-waveform"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;

          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-500 font-body text-sm",
                isActive && "bg-primary/10 border border-primary/20 text-foreground",
                isDone && "text-primary opacity-80",
                !isActive && !isDone && "text-muted-foreground/40"
              )}
            >
              <div className={cn(
                "transition-all duration-500",
                isActive && "text-primary animate-pulse-gold",
                isDone && "text-primary"
              )}>
                {isDone ? <CheckCircle className="w-5 h-5" /> : step.icon}
              </div>
              <span>{step.label}</span>
              {isActive && (
                <div className="ml-auto flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenerationProgress;
