import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VALID_ENTITY_TYPES = ['Organization', 'Corporation', 'LocalBusiness'];
const AMBIGUOUS_TYPES = ['Book', 'Thing'];

interface KnowledgeGraphItem {
  '@type'?: string | string[];
  result?: {
    '@id'?: string;
    name?: string;
    '@type'?: string | string[];
    description?: string;
    url?: string;
  };
  resultScore?: number;
}

interface KnowledgeGraphResponse {
  itemListElement?: KnowledgeGraphItem[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Brand name is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_KNOWLEDGE_GRAPH_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'API key not configured. Please add GOOGLE_KNOWLEDGE_GRAPH_API_KEY to your environment variables.'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const kgUrl = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodeURIComponent(query)}&key=${apiKey}&limit=10&indent=true`;

    const response = await fetch(kgUrl);

    if (!response.ok) {
      throw new Error(`Knowledge Graph API error: ${response.status}`);
    }

    const data: KnowledgeGraphResponse = await response.json();

    if (!data.itemListElement || data.itemListElement.length === 0) {
      return new Response(
        JSON.stringify({ status: 'ai-invisible' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const normalizeTypes = (types: string | string[] | undefined): string[] => {
      if (!types) return [];
      return Array.isArray(types) ? types : [types];
    };

    for (const item of data.itemListElement) {
      const result = item.result;
      if (!result) continue;

      const types = normalizeTypes(result['@type']);

      const hasValidEntityType = types.some(type =>
        VALID_ENTITY_TYPES.includes(type)
      );

      if (hasValidEntityType) {
        const entityId = result['@id'];
        return new Response(
          JSON.stringify({
            status: 'machine-verified',
            result: {
              name: result.name || query,
              entityId: entityId,
              types: types,
              description: result.description,
              url: result.url,
            }
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    for (const item of data.itemListElement) {
      const result = item.result;
      if (!result) continue;

      const types = normalizeTypes(result['@type']);

      const hasAmbiguousType = types.some(type =>
        AMBIGUOUS_TYPES.includes(type) || type === 'Thing'
      );

      if (hasAmbiguousType) {
        return new Response(
          JSON.stringify({
            status: 'ambiguous',
            result: {
              name: result.name || query,
              types: types,
              description: result.description,
            }
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ status: 'ai-invisible' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
