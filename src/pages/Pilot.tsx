import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLipSync } from "@/hooks/useLipSync";
import AvatarStage from "@/components/AvatarStage";

interface PilotData {
  pilot_id: string;
  brand_name: string;
  agent_id: string;
  source_url: string;
}

type Status = "idle" | "thinking" | "speaking";

const Pilot = () => {
  const { id } = useParams<{ id: string }>();
  const [pilot, setPilot] = useState<PilotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const { toast } = useToast();
  const { currentMouth, isSpeaking, speak, stop } = useLipSync();
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync speaking state back to status
  useEffect(() => {
    if (!isSpeaking && status === "speaking") {
      setStatus("idle");
      // Auto-focus input after speech ends
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isSpeaking, status]);

  useEffect(() => {
    const fetchPilot = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pilot-data?id=${id}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );
        if (!response.ok) throw new Error("Pilot not found");
        setPilot(await response.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPilot();
  }, [id]);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || status !== "idle" || !pilot) return;
    
    const userMessage = text.trim();
    setText(""); // Clear input immediately
    setStatus("thinking");

    try {
      // Step 1: Call AI chat endpoint
      const chatRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ pilot_id: pilot.pilot_id, message: userMessage }),
        }
      );

      if (!chatRes.ok) {
        const err = await chatRes.json().catch(() => ({ error: "Chat failed" }));
        throw new Error(err.error || "Chat request failed");
      }

      const { reply } = await chatRes.json();
      console.log("AI reply:", reply?.substring(0, 100));

      // Step 2: Send AI response to TTS
      setStatus("speaking");

      const ttsRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: reply }),
        }
      );

      if (!ttsRes.ok) {
        const err = await ttsRes.json().catch(() => ({ error: "TTS failed" }));
        throw new Error(err.error || "TTS request failed");
      }

      const audioBuffer = await ttsRes.arrayBuffer();
      console.log("TTS audio bytes length:", audioBuffer.byteLength);
      await speak(audioBuffer);
    } catch (err: any) {
      console.error("Pipeline error:", err);
      setStatus("idle");
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      inputRef.current?.focus();
    }
  }, [text, status, pilot, speak, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !pilot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{error || "Not found"}</p>
      </div>
    );
  }

  const isDisabled = status !== "idle";

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-4 sm:px-6 bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[180px] pointer-events-none transition-all duration-1000 ${
          isSpeaking
            ? "w-[600px] h-[600px] bg-primary/20 opacity-100"
            : "w-[400px] h-[400px] bg-primary/5 opacity-50"
        }`}
      />

      {/* Header */}
      <div className="relative z-10 text-center pt-8 sm:pt-12 space-y-2">
        <p className="text-sm font-body tracking-[0.3em] uppercase text-gold-gradient font-medium">
          {pilot.brand_name}
        </p>
        <h1 className="text-xl sm:text-2xl font-display font-semibold">
          <span className="text-gold-gradient">Concierge</span>
        </h1>
      </div>

      {/* Avatar Stage */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full max-w-xs py-4">
        <AvatarStage currentMouth={currentMouth} isSpeaking={isSpeaking} />
      </div>

      {/* Controls */}
      <div className="relative z-10 w-full max-w-sm pb-8 sm:pb-12 space-y-4">
        {/* Status */}
        <div className="text-center text-sm text-muted-foreground font-body">
          {status === "thinking" ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
              <span className="ml-1">Thinking…</span>
            </span>
          ) : status === "speaking" ? (
            "Speaking…"
          ) : (
            "Ask me anything"
          )}
        </div>

        {/* Input + send */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-border bg-card/50 px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-40"
            disabled={isDisabled}
          />
          <button
            type="submit"
            disabled={isDisabled || !text.trim()}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Powered by footer */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-block text-xs text-muted-foreground/50 font-body hover:text-muted-foreground transition-colors"
          >
            Powered by <span className="text-gold-gradient">Pilot</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Pilot;
