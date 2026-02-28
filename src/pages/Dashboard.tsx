import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  QrCode,
  Eye,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Package,
  Settings,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getPilotSettings,
  savePilotSettings,
  ROLE_LABELS,
  type PilotRole,
  type PilotSettings,
} from "@/lib/pilot-settings";

interface PilotData {
  pilot_id: string;
  brand_name: string;
  source_url: string;
  agent_id: string;
  pages_scraped: number;
}

const Dashboard = () => {
  const { id } = useParams<{ id: string }>();
  const [pilot, setPilot] = useState<PilotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Personality settings
  const [settings, setSettings] = useState<PilotSettings>(
    getPilotSettings(id || "")
  );

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

  const pilotUrl = `${window.location.origin}/pilot/${id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pilotUrl)}&bgcolor=0a0a0a&color=ffffff`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pilotUrl);
    setCopied(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = () => {
    if (!id) return;
    savePilotSettings(id, settings);
    toast({ title: "Pilot personality updated", description: "Changes will apply to the next conversation." });
  };

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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-4 animate-fade-in">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body tracking-[0.3em] uppercase"
          >
            Pilot
          </Link>

          <div className="flex items-center justify-center gap-2 text-primary">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-body font-medium">
              Pilot Generated
            </span>
          </div>

          <h1 className="text-3xl font-display font-semibold">
            {pilot.brand_name}
          </h1>
        </div>

        {/* Stats row */}
        <div
          className="flex items-center justify-center gap-6 text-sm font-body animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <a
            href={pilot.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="truncate max-w-[140px]">
              {new URL(pilot.source_url).hostname}
            </span>
            <ExternalLink className="w-3 h-3" />
          </a>
          {pilot.pages_scraped > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Package className="w-3.5 h-3.5" />
              <span>{pilot.pages_scraped} pages scraped</span>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div
          className="bg-card border border-border rounded-lg p-8 glow-gold animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground">
            <QrCode className="w-4 h-4" />
            <span className="text-xs font-body uppercase tracking-widest">
              Scan to connect
            </span>
          </div>
          <img
            src={qrUrl}
            alt="QR Code for pilot"
            className="w-48 h-48 mx-auto rounded"
          />
        </div>

        {/* Actions */}
        <div
          className="space-y-3 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <Button asChild size="lg" className="w-full h-12 font-body">
            <Link to={`/pilot/${id}`}>
              <Eye className="w-4 h-4 mr-2" />
              Preview Pilot
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 font-body"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Pilot Link
              </>
            )}
          </Button>
        </div>

        {/* Personality Settings */}
        <div
          className="bg-card border border-border rounded-lg p-6 text-left space-y-5 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex items-center gap-2 text-foreground">
            <Settings className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-display font-semibold">
              Customize Your Pilot
            </h2>
          </div>

          {/* Role Selector */}
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">
              Pilot Role
            </label>
            <Select
              value={settings.role}
              onValueChange={(val: PilotRole) =>
                setSettings((s) => ({ ...s, role: val }))
              }
            >
              <SelectTrigger className="w-full h-11 bg-secondary border-border font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABELS) as PilotRole[]).map((key) => (
                  <SelectItem key={key} value={key} className="font-body">
                    {ROLE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Role Description */}
          {settings.role === "custom" && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-sm font-body font-medium text-foreground">
                Describe how you want your Pilot to behave
              </label>
              <Textarea
                value={settings.customRoleDescription}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    customRoleDescription: e.target.value,
                  }))
                }
                placeholder="Example: Act as a knowledgeable sommelier who pairs wines with moods…"
                className="bg-secondary border-border font-body text-sm min-h-[80px] resize-none"
              />
            </div>
          )}

          {/* Additional Instructions */}
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">
              Additional Instructions
            </label>
            <Textarea
              value={settings.additionalInstructions}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  additionalInstructions: e.target.value,
                }))
              }
              placeholder="Example: Be persuasive but not pushy. Keep answers short. Emphasize craftsmanship."
              className="bg-secondary border-border font-body text-sm min-h-[80px] resize-none"
            />
          </div>

          <Button
            onClick={handleSaveSettings}
            className="w-full h-11 font-body font-medium"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Personality
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
