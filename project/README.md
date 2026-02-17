# The Entity ID Searcher

A React tool that helps you discover how AI sees your brand in Google's Knowledge Graph.

## Features

- Search for brand names in the Google Knowledge Graph
- Filter results by entity type (Organization, Corporation, LocalBusiness)
- Display entity IDs with machine-verified badges
- Identify ambiguous results (topics vs brands)
- Show AI-invisible status for brands not in the knowledge graph

## Setup

### Google Knowledge Graph API Key

To use this tool, you need a Google Knowledge Graph API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Knowledge Graph Search API
4. Create credentials (API Key)
5. Add the API key as an environment variable: `GOOGLE_KNOWLEDGE_GRAPH_API_KEY`

The Edge Function will automatically use this key to make requests to the Knowledge Graph API.

## How It Works

1. Enter a brand name in the search field
2. The app sends a request to the Knowledge Graph API via a secure Edge Function
3. Results are filtered by entity type:
   - **Machine-Verified**: Organization, Corporation, or LocalBusiness entities with valid IDs
   - **Ambiguous**: Books, topics, or generic entities
   - **AI-Invisible**: No entity found in the knowledge graph

## Technology Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase Edge Functions
- Google Knowledge Graph API
