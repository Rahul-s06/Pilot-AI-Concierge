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

    // 1. Scrape homepage metadata via Firecrawl
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    let pageTitle = "Brand";
    let metaDescription = "";
    let pageContent = "";
    try {
      console.log("Scraping URL via Firecrawl:", url);
      const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      });

      const scrapeData = await scrapeRes.json();

      if (scrapeRes.ok && scrapeData.success) {
        const metadata = scrapeData.data?.metadata || scrapeData.metadata;
        const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";

        if (metadata?.title) pageTitle = metadata.title;
        if (metadata?.description) metaDescription = metadata.description;
        pageContent = markdown.substring(0, 4000); // First 4000 chars for context
        console.log("Firecrawl scrape successful, brand:", pageTitle);
      } else {
        console.error("Firecrawl scrape failed:", JSON.stringify(scrapeData));
      }
    } catch (e) {
      console.error("Failed to scrape URL via Firecrawl:", e);
    }

    // 2. Discover and scrape product catalog pages via Firecrawl Map
    let catalogContent = "";
    try {
      console.log("Mapping product URLs via Firecrawl:", url);
      const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          search: "product",
          limit: 20,
          includeSubdomains: false,
        }),
      });

      const mapData = await mapRes.json();
      const productUrls: string[] = (mapData.links || []).slice(0, 20);
      console.log(`Found ${productUrls.length} product URLs`);

      if (productUrls.length > 0) {
        const scrapePromises = productUrls.map(async (productUrl: string) => {
          const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: productUrl,
              formats: ["markdown"],
              onlyMainContent: true,
            }),
          });
          const data = await res.json();
          const md = data.data?.markdown || data.markdown || "";
          return md.substring(0, 1500);
        });

        const results = await Promise.allSettled(scrapePromises);
        const chunks: string[] = [];
        let totalLen = 0;
        for (const r of results) {
          if (r.status === "fulfilled" && r.value) {
            if (totalLen + r.value.length > 12000) break;
            chunks.push(r.value);
            totalLen += r.value.length;
          }
        }
        catalogContent = chunks.join("\n\n---\n\n");
        console.log(`Catalog content collected: ${catalogContent.length} chars from ${chunks.length} pages`);
      }
    } catch (e) {
      console.error("Catalog scraping failed (non-fatal):", e);
    }

    // 3. Generate concierge system prompt via Lovable AI
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
                "You create voice concierge system prompts for brands. You also extract a clean, short brand name. Return a JSON object with two keys: \"system_prompt\" (the concierge prompt text) and \"brand_name\" (just the clean brand name, e.g. 'Gucci' not 'GUCCI® UK Official Site'). Return ONLY valid JSON, nothing else.",
            },
            {
              role: "user",
              content: `Create a voice concierge system prompt for this brand:\n\nRaw Title: ${pageTitle}\nDescription: ${metaDescription || "N/A"}\nWebsite: ${url}\n\nPage Content:\n${pageContent || "N/A"}\n\nProduct Catalog:\n${catalogContent || "No catalog data available"}\n\nThe concierge should be warm, knowledgeable about the brand and its products, and helpful. It should be able to discuss specific products when asked. Keep the system_prompt under 800 words. For brand_name, extract just the clean brand name (e.g. "Gucci" not "GUCCI® UK Official Site | Celebrate Italian Heritage").\n\nIMPORTANT VOICE STYLE: This is a VOICE interface, not text. The concierge MUST keep responses concise and conversational, like a real person talking — aim for 2 to 4 sentences per response. Never give long lists or dump information. If there's a lot to share, offer to go deeper rather than saying it all at once. Sound natural and helpful, not robotic or overly formal.\n\nIMPORTANT: Include in the system prompt that the agent has access to a tool called "send_product_link" which it should use when the user expresses interest in a specific product, wants to see it, or is ready to purchase. The tool takes "url" and "product_name" parameters. The agent should use product URLs from the catalog data when available.`,
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
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    let systemPrompt = "You are a helpful concierge.";
    let cleanBrandName = pageTitle;
    
    try {
      // Try to parse JSON response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        systemPrompt = parsed.system_prompt || systemPrompt;
        cleanBrandName = parsed.brand_name || pageTitle;
      } else {
        systemPrompt = rawContent;
      }
    } catch {
      // Fallback: use raw content as prompt, try simple brand cleanup
      systemPrompt = rawContent || systemPrompt;
      cleanBrandName = pageTitle
        .split(/[|–—·]/)[0]
        .replace(/[®™©]/g, "")
        .replace(/\b(official|site|uk|us|store|shop|online|home)\b/gi, "")
        .trim() || pageTitle;
    }
    
    console.log("Clean brand name:", cleanBrandName);

    // 3. Create REAL ElevenLabs conversational agent
    console.log("Using Lovable ElevenLabs connection - REAL MODE");

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY_1");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY_1 not configured");

    // First create the client tool
    console.log("Creating send_product_link client tool...");
    const toolRes = await fetch(
      "https://api.elevenlabs.io/v1/convai/tools",
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool_config: {
            type: "client",
            name: "send_product_link",
            description: "Send a clickable product link to the user when they want to see, learn about, or buy a product. You MUST use this tool whenever the user shows interest in a specific product. Always provide the full product URL and the product name.",
            parameters: {
              type: "object",
              properties: {
                url: { type: "string", description: "The full product page URL" },
                product_name: { type: "string", description: "Name of the product" },
              },
              required: ["url", "product_name"],
            },
          },
        }),
      }
    );

    let toolId: string | null = null;
    if (toolRes.ok) {
      const toolData = await toolRes.json();
      toolId = toolData.id;
      console.log("Client tool created:", toolId);
    } else {
      console.error("Failed to create client tool:", await toolRes.text());
    }

    const agentRes = await fetch(
      "https://api.elevenlabs.io/v1/convai/agents/create",
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Concierge - ${cleanBrandName}`,
          conversation_config: {
            agent: {
              prompt: {
                prompt: systemPrompt,
              },
              first_message: `Welcome to ${cleanBrandName}. How may I assist you today?`,
              language: "en",
              ...(toolId ? { tools: [{ id: toolId }] } : {}),
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
        brand_name: cleanBrandName,
        source_url: url,
        agent_id: agentId,
        catalog_summary: catalogContent || null,
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
