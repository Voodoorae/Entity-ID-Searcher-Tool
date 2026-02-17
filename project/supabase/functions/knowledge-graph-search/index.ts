import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_ENTITY_TYPES = ['Organization', 'Corporation', 'LocalBusiness', 'RealEstateAgent', 'HomeAndConstructionBusiness'];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    const apiKey = Deno.env.get('GOOGLE_KNOWLEDGE_GRAPH_API_KEY');
    const kgUrl = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodeURIComponent(query)}&key=${apiKey}&limit=5&indent=true`;

    const response = await fetch(kgUrl);
    const data = await response.json();

    if (!data.itemListElement || data.itemListElement.length === 0) {
      return new Response(JSON.stringify({ status: 'ai-invisible' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const item = data.itemListElement[0].result;
    
    // NEW: Extracting the location (City) from Google's response
    const location = item.address?.addressLocality || "your area";

    return new Response(
      JSON.stringify({
        status: 'machine-verified',
        result: {
          name: item.name,
          entityId: item['@id'],
          types: item['@type'],
          description: item.description,
          resultScore: data.itemListElement[0].resultScore,
          location: location // Sending the city to the frontend
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});