import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
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
    } catch (err: any) {
      console.error("Failed to start:", err);
      toast({
        title: "Microphone access required",
        description: "Please allow microphone access in your browser settings to use the voice concierge.",
        variant: "destructive",
      });
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
      {/* Ambient glow - always visible, intensifies when speaking */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[180px] pointer-events-none transition-all duration-1000 ${
          isConnected && isSpeaking
            ? "w-[600px] h-[600px] bg-primary/20 opacity-100"
            : isConnected
            ? "w-[500px] h-[500px] bg-primary/8 opacity-80"
            : "w-[400px] h-[400px] bg-primary/5 opacity-50"
        }`}
      />

      <div className="relative z-10 text-center space-y-8 sm:space-y-10 max-w-sm w-full">
        <div className="space-y-3">
          <p className="text-sm font-body tracking-[0.3em] uppercase text-gold-gradient font-medium">
            {pilot.brand_name}
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold">
            Speak to your <span className="text-gold-gradient">concierge</span>
          </h1>
        </div>

        {/* Mic button with outer ring and pulse rings */}
        <div className="relative flex items-center justify-center">
          {/* Static outer ring - always visible */}
          <div className="absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full border border-primary/15" />

          {/* Pulse rings - visible when speaking */}
          {isConnected && isSpeaking && (
            <>
              <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-primary/40 animate-pulse-ring" />
              <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-primary/30 animate-pulse-ring" style={{ animationDelay: "0.6s" }} />
              <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-primary/20 animate-pulse-ring" style={{ animationDelay: "1.2s" }} />
            </>
          )}

          <button
            onClick={isConnected ? stopConversation : startConversation}
            disabled={isConnecting}
            className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected
                ? "bg-primary text-primary-foreground scale-110 glow-gold"
                : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground hover:scale-105 animate-breathe"
            } ${isConnecting ? "animate-pulse-gold" : ""}`}
          >
            {isConnected ? (
              <MicOff className="w-8 h-8 sm:w-10 sm:h-10" />
            ) : (
              <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
            )}
          </button>
        </div>

        <div className="text-base sm:text-lg text-muted-foreground font-body font-light flex items-center justify-center gap-2">
          {isConnecting ? (
            "Connecting…"
          ) : isConnected ? (
            isSpeaking ? (
              "Concierge is speaking…"
            ) : (
              <>
                <div className="flex items-center gap-[2px] h-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[2px] bg-primary/50 rounded-full animate-waveform"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                Listening…
              </>
            )
          ) : (
            "Tap to begin"
          )}
        </div>

        {/* Live transcript */}
        {transcript.length > 0 && (
          <div className="relative">
            {/* Gradient fade at top */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background to-transparent z-10 rounded-t-lg pointer-events-none" />
            <ScrollArea className="h-48 sm:h-56 w-full rounded-lg border border-border bg-card/50 p-4">
              <div className="space-y-2.5 pt-4">
                {transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className={`text-sm sm:text-base font-body leading-relaxed ${
                      entry.role === "agent"
                        ? "text-foreground"
                        : "text-muted-foreground opacity-70"
                    }`}
                  >
                    <span className="text-primary/60 font-medium text-[11px] uppercase tracking-wider mr-1.5">
                      {entry.role === "agent" ? "Concierge" : "You"}
                    </span>
                    {entry.text}
                  </div>
                ))}
                <div ref={transcriptEnd} />
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Powered by footer */}
        <Link
          to="/"
          className="inline-block text-xs text-muted-foreground/50 font-body hover:text-muted-foreground transition-colors"
        >
          Powered by <span className="text-gold-gradient">Pilot</span>
        </Link>
      </div>
    </div>
  );
};

export default Pilot;
