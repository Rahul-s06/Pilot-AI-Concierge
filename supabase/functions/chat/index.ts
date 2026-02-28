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
    const { pilot_id, message } = await req.json();

    if (!pilot_id || !message) {
      return new Response(
        JSON.stringify({ error: "pilot_id and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch pilot data including catalog_summary for context
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: pilot, error: dbError } = await supabase
      .from("pilots")
      .select("*")
      .eq("id", pilot_id)
      .single();

    if (dbError || !pilot) {
      return new Response(
        JSON.stringify({ error: "Pilot not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build system prompt from stored data
    const systemPrompt = `You are a luxury voice concierge for ${pilot.brand_name}. 
You are warm, knowledgeable, and helpful. Keep responses concise (2-4 sentences) since they will be spoken aloud.
Website: ${pilot.source_url}

${pilot.catalog_summary ? `Product catalog knowledge:\n${pilot.catalog_summary}` : ""}

Guidelines:
- Be conversational and natural — your responses will be read aloud by a voice avatar.
- Keep answers brief and focused. No bullet points or markdown formatting.
- If asked about products, share specific details from the catalog.
- If the user wants to see or buy a product, mention the product by name and suggest they visit the website.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    console.log(`Chat request for pilot ${pilot_id}: "${message.substring(0, 80)}"`);

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
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
        }),
      }
    );

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);

      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI request failed");
    }

    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    console.log(`AI response: "${reply.substring(0, 100)}..."`);

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
