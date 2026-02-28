import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ url: url.trim() }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Generation failed");
      }

      const data = await response.json();
      navigate(`/dashboard/${data.pilot_id}`);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-12">
        {/* Logo */}
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Mic className="w-5 h-5 text-primary" />
            <span className="text-sm font-body tracking-[0.3em] uppercase text-muted-foreground">
              Pilot.ai
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-semibold leading-tight">
            Turn your website into a{" "}
            <span className="text-gold-gradient">voice concierge</span>
          </h1>
          <p className="text-lg text-muted-foreground font-body font-light mt-4 max-w-md mx-auto">
            Paste your URL. We'll create a luxury AI voice agent for your brand in seconds.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleGenerate}
          className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <Input
            type="url"
            placeholder="https://yourbrand.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="flex-1 h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground font-body"
          />
          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="h-12 px-6 font-body font-medium"
          >
            {loading ? (
              <Sparkles className="w-4 h-4 animate-pulse-gold" />
            ) : (
              <>
                Generate Pilot
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Subtle footer */}
        <p
          className="text-xs text-muted-foreground font-body animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          No account needed · Powered by AI
        </p>
      </div>
    </div>
  );
};

export default Index;
