// @ts-ignore
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

// Type declarations for Deno runtime
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not found');
    }

    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Analyzing image with OpenRouter AI...');

    // Determine a valid site URL for OpenRouter referer checking
    const appUrl =
      Deno.env.get('APP_URL') ||
      req.headers.get('origin') ||
      req.headers.get('referer') ||
      'http://localhost:5173';

    // Try OpenRouter with supported models (fallbacks if a model is unavailable)
    const models = [
      'google/gemini-1.5-flash',
      'google/gemini-1.5-flash-latest',
      'openai/gpt-4o-mini',
      'anthropic/claude-3.5-haiku'
    ];

    let response: Response | null = null;
    let lastError: string | undefined;

    for (const model of models) {
      console.log(`Attempting OpenRouter model: ${model}`);
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': appUrl,
          'X-Title': 'EcoBin Waste Detection',
        },
        body: JSON.stringify({
          model,
          messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and determine if it contains recyclable waste or garbage. 
                
                Please respond with a JSON object in this exact format:
                {
                  "isGarbage": true/false,
                  "confidence": 0.0-1.0,
                  "wasteType": "plastic|paper|metal|organic|glass|electronic|other|none",
                  "description": "brief description of what you see",
                  "pointsEarned": 0-50
                }
                
                Rules for point calculation:
                - Plastic items: 10-15 points based on size/quantity
                - Paper items: 8-12 points
                - Metal cans/items: 15-20 points
                - Glass bottles/jars: 12-18 points
                - Electronic items: 20-30 points
                - Organic waste: 5-10 points
                - Mixed recyclables: bonus points
                - Non-recyclable items: 0 points
                
                Only award points for clearly identifiable recyclable waste. If image is unclear, blurry, or doesn't contain waste, set isGarbage to false and pointsEarned to 0.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
        })
      });

      if (response.ok) break;

      const errorText = await response.text();
      lastError = `status=${response.status} body=${errorText}`;
      console.error('OpenRouter API error:', model, lastError);

      // Try next model only for 404/400 style model errors; otherwise stop
      if (response.status !== 404 && response.status !== 400) {
        break;
      }
    }

    if (!response || !response.ok) {
      throw new Error(`OpenRouter API error: ${lastError || 'unknown error'}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response:', aiResponse);

    if (!aiResponse.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from AI model');
    }

    // Extract JSON from the response
    let analysisResult;
    try {
      const content = aiResponse.choices[0].message.content;
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback parsing if JSON is not wrapped
        analysisResult = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback response if parsing fails
      analysisResult = {
        isGarbage: false,
        confidence: 0.5,
        wasteType: 'other',
        description: 'Unable to analyze image clearly',
        pointsEarned: 0
      };
    }

    // Validate and sanitize the response
    const validatedResult = {
      isGarbage: Boolean(analysisResult.isGarbage),
      confidence: Math.max(0, Math.min(1, Number(analysisResult.confidence) || 0)),
      wasteType: String(analysisResult.wasteType || 'other'),
      description: String(analysisResult.description || 'Analysis completed'),
      pointsEarned: Math.max(0, Math.min(50, Number(analysisResult.pointsEarned) || 0))
    };

    console.log('Validated result:', validatedResult);

    return new Response(
      JSON.stringify(validatedResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in detect-garbage function:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze image',
        details: message,
        isGarbage: false,
        confidence: 0,
        wasteType: 'other',
        description: 'Analysis failed',
        pointsEarned: 0
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});