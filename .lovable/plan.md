

## Plan: Scrape Product Catalog with Firecrawl

Currently, the `generate` function only scrapes the homepage (first 2000 chars of markdown). This gives the concierge very shallow product knowledge. Here's the plan to give it deep catalog awareness.

### Approach

Use Firecrawl's **Map** endpoint to discover product/catalog URLs on the site, then **scrape** the top product pages and feed all that content into the AI prompt for a much richer concierge.

### Steps

1. **Add a Map step** in `generate/index.ts` after the homepage scrape
   - Call Firecrawl `/v1/map` with the brand URL and `search: "product"` to find product/catalog pages
   - Limit to ~10 URLs to keep costs and latency reasonable

2. **Batch-scrape the discovered product pages**
   - For each discovered URL, call Firecrawl `/v1/scrape` (in parallel with `Promise.allSettled`)
   - Collect the first ~500 chars of markdown from each page
   - Combine into a single `catalogContent` string (capped at ~4000 chars total)

3. **Feed catalog content into the AI prompt**
   - Update the system prompt generation to include `catalogContent` alongside `pageContent`
   - This gives the concierge real product names, descriptions, and prices to reference

4. **Store catalog data in the database** (optional enrichment)
   - Add a `catalog_summary` text column to the `pilots` table
   - Store the combined catalog markdown so it can be referenced later without re-scraping

### Technical detail

The Map + parallel scrape adds latency (~5-10s extra). To keep the user experience smooth, the generation already takes time, so this fits within that flow. We cap at 10 product pages and 4000 chars total to stay within ElevenLabs agent prompt limits.

