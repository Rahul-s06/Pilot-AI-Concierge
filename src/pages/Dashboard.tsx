import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, QrCode, Eye, Mic } from "lucide-react";

interface PilotData {
  pilot_id: string;
  brand_name: string;
  source_url: string;
  agent_id: string;
}

const Dashboard = () => {
  const { id } = useParams<{ id: string }>();
  const [pilot, setPilot] = useState<PilotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const data = await response.json();
        setPilot(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPilot();
  }, [id]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `${window.location.origin}/pilot/${id}`
  )}&bgcolor=0a0a0a&color=d4a843`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !pilot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{error || "Not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body tracking-[0.3em] uppercase">
            <Mic className="w-4 h-4 text-primary" />
            Pilot.ai
          </Link>

          <div className="flex items-center justify-center gap-2 text-primary">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-body font-medium">Pilot Generated</span>
          </div>

          <h1 className="text-3xl font-display font-semibold">{pilot.brand_name}</h1>
          <p className="text-sm text-muted-foreground font-body">{pilot.source_url}</p>
        </div>

        {/* QR Code */}
        <div className="bg-card border border-border rounded-lg p-8 glow-gold">
          <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground">
            <QrCode className="w-4 h-4" />
            <span className="text-xs font-body uppercase tracking-widest">Scan to connect</span>
          </div>
          <img
            src={qrUrl}
            alt="QR Code for pilot"
            className="w-48 h-48 mx-auto rounded"
          />
        </div>

        {/* Info */}
        <div className="bg-card border border-border rounded-lg p-4 text-left space-y-2">
          <div className="flex justify-between text-sm font-body">
            <span className="text-muted-foreground">Agent ID</span>
            <span className="text-foreground font-mono text-xs">{pilot.agent_id.slice(0, 16)}…</span>
          </div>
        </div>

        {/* Actions */}
        <Button asChild size="lg" className="w-full h-12 font-body">
          <Link to={`/pilot/${id}`}>
            <Eye className="w-4 h-4 mr-2" />
            Preview Pilot
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
