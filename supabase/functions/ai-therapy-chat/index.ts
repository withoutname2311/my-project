import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simulated AI responses for demo purposes
const generateSimulatedResponse = (message: string, biometricData: any = null): string => {
  const responses = [
    "I understand you're reaching out, and I'm here to support you. It's completely normal to have ups and downs, especially as a university student. Can you tell me more about what's been on your mind lately?",
    
    "Thank you for sharing that with me. It sounds like you're dealing with some challenging feelings right now. Remember that seeking support is a sign of strength, not weakness. Have you tried any relaxation techniques recently?",
    
    "I hear you, and your feelings are completely valid. University life can be overwhelming with academic pressures, social expectations, and personal growth all happening at once. Let's focus on some practical steps you can take right now.",
    
    "It's great that you're being mindful of your mental health. Based on what you've shared, I'd like to suggest a few gentle techniques that might help. Would you be interested in trying a brief breathing exercise together?",
    
    "I appreciate you opening up about this. Many students experience similar challenges, and you're not alone in feeling this way. Let's explore some coping strategies that might work well for your situation."
  ];

  // Add biometric-specific responses if data is provided
  if (biometricData) {
    const { heartRate, stressLevel, sleepQuality } = biometricData;
    
    if (stressLevel > 70) {
      return "I notice from your smartwatch data that your stress levels are quite elevated right now. This is your body's way of telling you it needs some care. Let's try a simple 4-7-8 breathing technique: breathe in for 4 counts, hold for 7, and exhale for 8. This can help activate your body's relaxation response. Would you like to try this together?";
    }
    
    if (heartRate > 100) {
      return "Your heart rate seems elevated based on your smartwatch data. This could be related to stress, caffeine, or physical activity. Let's focus on some grounding techniques. Can you tell me 5 things you can see around you right now? This can help bring your nervous system back to a calmer state.";
    }
    
    if (sleepQuality < 60) {
      return "I see from your sleep data that you haven't been getting the best quality rest lately. Poor sleep can really impact our mood and stress levels. Have you noticed any patterns in your sleep routine? Sometimes small changes like putting devices away an hour before bed or keeping a consistent sleep schedule can make a big difference.";
    }
  }

  // Return a random supportive response
  return responses[Math.floor(Math.random() * responses.length)];
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], biometricData = null } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Processing wellness chat request:', { message, hasBiometrics: !!biometricData });

    // Generate a simulated AI response
    const aiResponse = generateSimulatedResponse(message, biometricData);

    console.log('AI wellness response generated successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      conversationId: crypto.randomUUID()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-therapy-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: 'Please try again or contact support if the issue persists'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});