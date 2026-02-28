import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PilotData {
  pilot_id: string;
  brand_name: string;
  agent_id: string;
}

interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
  id: number;
}

const Pilot = () => {
  const { id } = useParams<{ id: string }>();
  const [pilot, setPilot] = useState<PilotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const transcriptEnd = useRef<HTMLDivElement>(null);
  const entryId = useRef(0);

  const conversation = useConversation({
    onConnect: () => console.log("Connected to ElevenLabs agent - REAL MODE"),
    onDisconnect: () => console.log("Disconnected from agent"),
    onError: (err) => console.error("Conversation error:", err),
    onMessage: (message) => {
      const role = message.source === "user" ? "user" : "agent";
      setTranscript((prev) => [
        ...prev,
        { role, text: message.message, id: entryId.current++ },
      ]);
    },
  });

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

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

  const startConversation = useCallback(async () => {
    if (!pilot) return;
    setIsConnecting(true);
    setTranscript([]);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: pilot.agent_id,
        connectionType: "webrtc",
      });
    } catch (err) {
      console.error("Failed to start:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, pilot]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

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

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 bg-background relative overflow-hidden">
      {isConnected && (
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[150px] pointer-events-none transition-opacity duration-1000 ${
            isSpeaking ? "bg-primary/15 opacity-100" : "bg-primary/5 opacity-60"
          }`}
        />
      )}

      <div className="relative z-10 text-center space-y-8 sm:space-y-10 max-w-sm w-full">
        <div className="space-y-2">
          <p className="text-xs font-body tracking-[0.3em] uppercase text-muted-foreground">
            {pilot.brand_name}
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold">
            Speak to your <span className="text-gold-gradient">concierge</span>
          </h1>
        </div>

        {/* Mic button with pulse rings */}
        <div className="relative flex items-center justify-center">
          {/* Pulse rings - visible when speaking */}
          {isConnected && isSpeaking && (
            <>
              <div className="absolute w-24 h-24 rounded-full border border-primary/40 animate-pulse-ring" />
              <div className="absolute w-24 h-24 rounded-full border border-primary/30 animate-pulse-ring" style={{ animationDelay: "0.6s" }} />
              <div className="absolute w-24 h-24 rounded-full border border-primary/20 animate-pulse-ring" style={{ animationDelay: "1.2s" }} />
            </>
          )}

          <button
            onClick={isConnected ? stopConversation : startConversation}
            disabled={isConnecting}
            className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected
                ? "bg-primary text-primary-foreground scale-110 glow-gold"
                : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground hover:scale-105"
            } ${isConnecting ? "animate-pulse-gold" : ""}`}
          >
            {isConnected ? (
              <MicOff className="w-7 h-7 sm:w-8 sm:h-8" />
            ) : (
              <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
            )}
          </button>
        </div>

        <p className="text-sm text-muted-foreground font-body">
          {isConnecting
            ? "Connecting…"
            : isConnected
            ? isSpeaking
              ? "Concierge is speaking…"
              : "Listening…"
            : "Tap to begin"}
        </p>

        {/* Live transcript */}
        {transcript.length > 0 && (
          <ScrollArea className="h-40 sm:h-48 w-full rounded-lg border border-border bg-card/50 p-3">
            <div className="space-y-2">
              {transcript.map((entry) => (
                <div
                  key={entry.id}
                  className={`text-xs sm:text-sm font-body leading-relaxed ${
                    entry.role === "agent"
                      ? "text-foreground"
                      : "text-muted-foreground opacity-70"
                  }`}
                >
                  <span className="text-primary/60 font-medium text-[10px] uppercase tracking-wider mr-1.5">
                    {entry.role === "agent" ? "Concierge" : "You"}
                  </span>
                  {entry.text}
                </div>
              ))}
              <div ref={transcriptEnd} />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default Pilot;
