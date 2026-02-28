import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff } from "lucide-react";

interface PilotData {
  pilot_id: string;
  brand_name: string;
  agent_id: string;
}

const Pilot = () => {
  const { id } = useParams<{ id: string }>();
  const [pilot, setPilot] = useState<PilotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [mockResponse, setMockResponse] = useState("");

  const isTestMode = pilot?.agent_id?.startsWith("test_agent_");

  const conversation = useConversation({
    onConnect: () => console.log("Connected to agent"),
    onDisconnect: () => console.log("Disconnected"),
    onError: (err) => console.error("Conversation error:", err),
  });

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

  const handleMockStart = () => {
    setMockResponse(
      `Hello, welcome to ${pilot?.brand_name}. How may I assist you today?`
    );
  };

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

  // Test mode UI
  if (isTestMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

        <div className="relative z-10 text-center space-y-10 max-w-sm w-full">
          <div className="space-y-2">
            <p className="text-xs font-body tracking-[0.3em] uppercase text-muted-foreground">
              {pilot.brand_name}
            </p>
            <h1 className="text-3xl md:text-4xl font-display font-semibold">
              Speak to your <span className="text-gold-gradient">concierge</span>
            </h1>
            <p className="text-sm text-muted-foreground font-body mt-2">
              Test Mode – ElevenLabs not connected
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-body font-mono">
              Agent: {pilot.agent_id}
            </p>
          </div>

          <button
            onClick={handleMockStart}
            className="mx-auto w-full max-w-[240px] h-14 rounded-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 font-body font-medium"
          >
            <Mic className="w-5 h-5" />
            Simulate Voice Start
          </button>

          {mockResponse && (
            <div className="bg-secondary/50 border border-border rounded-2xl p-6 text-left animate-fade-in">
              <p className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-3">
                Concierge
              </p>
              <p className="text-foreground font-body text-base leading-relaxed">
                "{mockResponse}"
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Real ElevenLabs UI
  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden">
      {isConnected && (
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[150px] pointer-events-none transition-opacity duration-1000 ${
            isSpeaking ? "bg-primary/15 opacity-100" : "bg-primary/5 opacity-60"
          }`}
        />
      )}

      <div className="relative z-10 text-center space-y-10 max-w-sm w-full">
        <div className="space-y-2">
          <p className="text-xs font-body tracking-[0.3em] uppercase text-muted-foreground">
            {pilot.brand_name}
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-semibold">
            Speak to your <span className="text-gold-gradient">concierge</span>
          </h1>
        </div>

        <button
          onClick={isConnected ? stopConversation : startConversation}
          disabled={isConnecting}
          className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            isConnected
              ? "bg-primary text-primary-foreground scale-110 glow-gold"
              : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground hover:scale-105"
          } ${isConnecting ? "animate-pulse-gold" : ""}`}
        >
          {isConnected ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        <p className="text-sm text-muted-foreground font-body">
          {isConnecting
            ? "Connecting…"
            : isConnected
            ? isSpeaking
              ? "Concierge is speaking…"
              : "Listening…"
            : "Tap to begin"}
        </p>
      </div>
    </div>
  );
};

export default Pilot;
