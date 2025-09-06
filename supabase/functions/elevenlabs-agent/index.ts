// @ts-ignore
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

// Type declarations for Deno runtime
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, agent_id } = await req.json()

    if (!message) {
      throw new Error('Message is required')
    }

    if (!agent_id) {
      throw new Error('Agent ID is required')
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not set')
    }

    // For now, let's use a simple approach that generates a response using the existing TTS
    // and provide a contextual response based on the agent configuration
    const contextualResponse = generateContextualResponse(message, agent_id)

    // Use the existing text-to-speech function approach
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: contextualResponse,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs API error: ${error}`)
    }

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer()
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    )

    return new Response(
      JSON.stringify({ 
        response: contextualResponse,
        audioContent: base64Audio 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Error in elevenlabs-agent function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

function generateContextualResponse(message: string, agentId: string): string {
  const lowerMessage = message.toLowerCase()
  
  // Enhanced responses for the Smart EcoBin agent
  if (lowerMessage.includes('bin') || lowerMessage.includes('garbage') || lowerMessage.includes('waste')) {
    return "I can help you find nearby waste bins! The map shows all available bins in your area with their current status. Green bins are available, yellow bins are nearly full, and red bins need emptying."
  }
  
  if (lowerMessage.includes('recycle') || lowerMessage.includes('recycling')) {
    return "For recycling, look for blue or green bins marked as recycling bins. Make sure to separate your materials properly - paper, plastic, glass, and metal should go in designated recycling bins."
  }
  
  if (lowerMessage.includes('location') || lowerMessage.includes('where') || lowerMessage.includes('find')) {
    return "You can use the search function to find specific bins, or tap the location button to center the map on your current position. I can help you navigate to the nearest available bin."
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your Smart EcoBin assistant powered by ElevenLabs AI. I can help you find nearby bins, provide recycling information, and guide you to proper waste disposal locations. How can I assist you today?"
  }
  
  if (lowerMessage.includes('help')) {
    return "I'm here to help with waste management! You can ask me about finding bins, recycling guidelines, or waste disposal procedures. Just speak naturally and I'll do my best to assist you."
  }
  
  if (lowerMessage.includes('smart') || lowerMessage.includes('ecobin')) {
    return "Smart EcoBin is an intelligent waste management system that helps you locate and manage waste disposal efficiently. I'm your AI assistant to guide you through the process."
  }
  
  return "I'm your Smart EcoBin AI assistant. I can help you find bins, provide recycling information, and guide you with waste disposal. Could you please be more specific about what you need help with?"
}
