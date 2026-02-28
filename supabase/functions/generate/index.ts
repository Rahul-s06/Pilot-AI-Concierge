import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch homepage metadata
    let pageTitle = "Brand";
    let metaDescription = "";
    try {
      const pageRes = await fetch(url, {
        headers: { "User-Agent": "PilotAI/1.0" },
      });
      const html = await pageRes.text();

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) pageTitle = titleMatch[1].trim();

      const descMatch = html.match(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
      );
      if (descMatch) metaDescription = descMatch[1].trim();
    } catch (e) {
      console.error("Failed to fetch URL:", e);
    }

    // 2. Generate concierge system prompt via Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You create luxury voice concierge system prompts for brands. Return ONLY the system prompt text, nothing else.",
            },
            {
              role: "user",
              content: `Create a luxury voice concierge system prompt for this brand:\n\nBrand: ${pageTitle}\nDescription: ${metaDescription || "N/A"}\nWebsite: ${url}\n\nThe concierge should be warm, sophisticated, knowledgeable about the brand, and helpful. Keep it under 500 words.`,
            },
          ],
        }),
      }
    );

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      throw new Error("Failed to generate prompt");
    }

    const aiData = await aiRes.json();
    const systemPrompt =
      aiData.choices?.[0]?.message?.content || "You are a helpful concierge.";

    // 3. Create REAL ElevenLabs conversational agent
    console.log("Using Lovable ElevenLabs connection - REAL MODE");

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY_1");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY_1 not configured");

    const agentRes = await fetch(
      "https://api.elevenlabs.io/v1/convai/agents/create",
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Concierge - ${pageTitle}`,
          conversation_config: {
            agent: {
              prompt: {
                prompt: systemPrompt,
              },
              first_message: `Welcome to ${pageTitle}. How may I assist you today?`,
              language: "en",
            },
          },
        }),
      }
    );

    if (!agentRes.ok) {
      const errBody = await agentRes.text();
      console.error("ElevenLabs agent creation error:", agentRes.status, errBody);
      throw new Error(`Failed to create agent: ${agentRes.status}`);
    }

    const agentData = await agentRes.json();
    const agentId = agentData.agent_id;

    if (!agentId) {
      console.error("No agent_id in response:", JSON.stringify(agentData));
      throw new Error("No agent_id returned from ElevenLabs");
    }

    console.log("Real ElevenLabs agent created:", agentId);

    // 4. Store in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: pilot, error: dbError } = await supabase
      .from("pilots")
      .insert({
        brand_name: pageTitle,
        source_url: url,
        agent_id: agentId,
      })
      .select()
      .single();

    if (dbError) throw new Error(`DB error: ${dbError.message}`);

    return new Response(
      JSON.stringify({
        pilot_id: pilot.id,
        brand_name: pilot.brand_name,
        agent_id: pilot.agent_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("generate error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
