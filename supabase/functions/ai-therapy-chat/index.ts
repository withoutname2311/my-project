import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('Processing wellness chat request:', { 
      message: message.substring(0, 100) + '...', 
      hasBiometrics: !!biometricData,
      hasOpenAIKey: !!openAIApiKey
    });

    // Enhanced system prompt for university student wellness with Supabase integration
    const systemPrompt = `You are Avira AI, a compassionate wellness assistant specifically designed for university students' mental health support. Your role is to:

CORE RESPONSIBILITIES:
1. Analyze smartwatch/biometric data for signs of stress, anxiety, or fatigue
2. Suggest safe, non-medical interventions like breathing exercises, meditation, movement, hydration, sleep hygiene
3. Provide emotional support in a friendly, non-judgmental way (like a digital companion)
4. Encourage professional help if data or responses suggest severe distress or crisis
5. NEVER prescribe medicines - only suggest lifestyle and wellness practices
6. Integrate with the user's wellness tracking data and appointment system

WELLNESS INTERVENTIONS YOU CAN SUGGEST:
• Breathing exercises (4-7-8 technique, box breathing, calm breathing)
• Grounding techniques (5-4-3-2-1 sensory method)
• Short meditation or relaxation breaks
• Gentle movement, stretching, or walking
• Hydration and nutrition reminders
• Sleep hygiene tips
• CBT-style reflection questions
• Journaling prompts
• Suggest booking a consultation with a therapist if needed

BIOMETRIC DATA ANALYSIS:
When users share smartwatch data, analyze for patterns indicating:
- High stress (elevated heart rate, high stress levels)
- Poor sleep quality (low sleep scores)
- Low activity levels (minimal steps/movement)
- Irregular patterns that might indicate health concerns

CRISIS DETECTION:
If responses suggest severe mental health crisis, suicidal ideation, or serious health risks, immediately encourage:
- Seeking professional help
- Crisis hotlines (988 for suicide prevention)
- Emergency services (911)
- Booking an urgent consultation through the platform

COMMUNICATION STYLE:
- Warm, empathetic, and non-judgmental
- Use university student-friendly language
- Provide practical, actionable advice
- Be encouraging and supportive
- Acknowledge the unique stressors of student life (exams, deadlines, social pressures, financial stress)
- Reference their wellness data when relevant
- Suggest platform features (mood tracking, therapy modules, booking consultations)

PLATFORM INTEGRATION:
- Reference their mood tracking history when relevant
- Suggest therapy modules available in the app
- Recommend booking consultations for ongoing support
- Encourage use of emergency support features if needed

Remember: You provide supportive guidance but are NOT a replacement for professional mental health care. Always encourage professional help for serious concerns.`;

    // Prepare the user message with biometric context if available
    let userMessageContent = message;
    if (biometricData) {
      userMessageContent = `${message}

[CURRENT BIOMETRIC DATA FROM SMARTWATCH]:
- Heart Rate: ${biometricData.heartRate} BPM
- Blood Oxygen: ${biometricData.oxygenLevel}%
- Stress Level: ${biometricData.stressLevel}%
- Sleep Quality: ${biometricData.sleepQuality}%
- Steps Today: ${biometricData.steps}
- Body Temperature: ${biometricData.temperature}°F
- Timestamp: ${biometricData.timestamp}

Please analyze this biometric data alongside my message and provide personalized wellness recommendations.`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessageContent }
    ];

    let aiResponse: string;

    if (openAIApiKey) {
      // Use OpenAI API if key is available
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
            presence_penalty: 0.6,
            frequency_penalty: 0.3,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('OpenAI API error:', error);
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        aiResponse = data.choices[0].message.content;
        console.log('OpenAI response generated successfully');
      } catch (openAIError) {
        console.error('OpenAI API failed, falling back to simulated response:', openAIError);
        aiResponse = generateSimulatedResponse(message, biometricData);
      }
    } else {
      // Fallback to simulated response if no API key
      console.log('No OpenAI API key found, using simulated response');
      aiResponse = generateSimulatedResponse(message, biometricData);
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      conversationId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-therapy-chat function:', error);
    
    // Provide a helpful fallback response even on error
    const fallbackResponse = "I'm experiencing some technical difficulties right now, but I'm still here to support you. If you're feeling overwhelmed or in crisis, please don't hesitate to reach out to the crisis support resources in the app or contact emergency services if needed. You can also try booking a consultation with one of our professional therapists. Is there anything specific I can help you with using the other features in the app?";
    
    return new Response(JSON.stringify({ 
      response: fallbackResponse,
      conversationId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      error: 'Fallback response due to technical issues'
    }), {
      status: 200, // Return 200 to avoid frontend errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Enhanced simulated response function with more sophisticated logic
function generateSimulatedResponse(message: string, biometricData: any = null): string {
  const lowerMessage = message.toLowerCase();
  
  // Crisis detection keywords
  const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'want to die', 'hurt myself', 'self harm'];
  const isCrisis = crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (isCrisis) {
    return `I'm really concerned about what you've shared with me. Your safety is the most important thing right now. Please reach out for immediate help:

🚨 **Crisis Resources:**
• National Suicide Prevention Lifeline: **988**
• Crisis Text Line: Text **HOME** to **741741**
• Emergency Services: **911**

You can also use the Emergency Support section in the app for more resources. Please don't go through this alone - there are people who want to help you. Would you like me to help you find a therapist to book an urgent consultation?`;
  }

  // Analyze biometric data if provided
  if (biometricData) {
    const { heartRate, stressLevel, sleepQuality, oxygenLevel, steps } = biometricData;
    
    if (stressLevel > 80) {
      return `I can see from your smartwatch that your stress levels are very high right now (${Math.round(stressLevel)}%). Your body is telling you it needs immediate care. Let's try some quick stress relief:

🫁 **Immediate Relief - 4-7-8 Breathing:**
1. Breathe in through your nose for 4 counts
2. Hold your breath for 7 counts  
3. Exhale through your mouth for 8 counts
4. Repeat 3-4 times

This activates your parasympathetic nervous system and can lower stress hormones. You can find guided breathing exercises in the Wellness tab.

Your heart rate is also ${Math.round(heartRate)} BPM. After the breathing exercise, try to find a quiet space and maybe do some gentle stretching. How are you feeling emotionally right now?`;
    }
    
    if (heartRate > 100 && stressLevel > 60) {
      return `I notice your heart rate is elevated (${Math.round(heartRate)} BPM) and your stress levels are high (${Math.round(stressLevel)}%). This suggests your nervous system is in fight-or-flight mode.

🌱 **Let's ground you right now - 5-4-3-2-1 Technique:**
• **5** things you can see around you
• **4** things you can touch
• **3** things you can hear
• **2** things you can smell  
• **1** thing you can taste

This helps bring your nervous system back to baseline. You can also try the grounding exercises in the Interactive Wellness section.

What's been causing you stress today? Sometimes talking through it can help lower these physical stress responses.`;
    }
    
    if (sleepQuality < 50) {
      return `Your sleep quality has been quite low (${Math.round(sleepQuality)}%), which can really impact your mood, stress levels, and overall wellbeing. Poor sleep often creates a cycle where stress makes it harder to sleep, and lack of sleep increases stress.

😴 **Tonight's Sleep Strategy:**
• Put devices away 1 hour before bed
• Try the calm breathing exercise (3 seconds in, 6 seconds out)
• Keep your room cool and dark
• Consider some gentle stretching or meditation

Your current stress level is ${Math.round(stressLevel)}% - this might be contributing to your sleep issues. Have you noticed any patterns in what's keeping you up at night? Academic stress, social concerns, or something else?

The app has sleep hygiene tips in the Wellness section that might help.`;
    }
    
    if (steps < 2000) {
      return `I see you've only taken ${steps} steps today. Low activity can sometimes contribute to feeling down or anxious, and your current stress level is ${Math.round(stressLevel)}%.

🚶‍♀️ **Gentle Movement Ideas:**
• 5-minute walk around your dorm/apartment
• Desk stretches between study sessions
• Dancing to 2-3 favorite songs
• Walking to get a healthy snack or water

Movement helps process stress hormones and releases endorphins. Even 5-10 minutes can make a difference in how you feel.

What's been keeping you sedentary today? Sometimes understanding the 'why' helps us find gentle ways to add movement back in.`;
    }
  }

  // Emotional support responses based on message content
  if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
    return `I hear that you're feeling anxious, and I want you to know that's completely understandable. Anxiety is your mind's way of trying to protect you, even when it feels overwhelming.

🌸 **Right now, try this:**
• Take 3 slow, deep breaths
• Name 3 things you can see, 2 you can hear, 1 you can smell
• Remind yourself: "This feeling will pass"

University life comes with so many uncertainties - academics, social situations, future planning. It's normal for your mind to feel overwhelmed sometimes.

What's been triggering your anxiety lately? Sometimes naming it can help reduce its power. You can also explore the CBT exercises in the Therapy Modules section, or consider booking a session with one of our therapists who specialize in anxiety.`;
  }
  
  if (lowerMessage.includes('depressed') || lowerMessage.includes('sad') || lowerMessage.includes('down')) {
    return `Thank you for sharing how you're feeling with me. Depression and sadness can feel so heavy, and it takes courage to reach out. Your feelings are valid, and you deserve support.

💙 **Small steps that can help:**
• Try to get some sunlight today, even just by a window
• Reach out to one person you care about
• Do one small thing that usually brings you joy
• Be gentle with yourself - you're doing the best you can

Depression often tells us lies - that we're alone, that things won't get better, that we're not worth caring for. But none of those things are true.

How long have you been feeling this way? Sometimes talking to a professional can provide tools and perspectives that really help. Our platform has therapists who specialize in depression and can work with you on evidence-based treatments.

You're not alone in this. 💙`;
  }
  
  if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed')) {
    return `Feeling stressed and overwhelmed is so common in university life - you're definitely not alone in this. Between academics, social pressures, maybe work or family expectations, it can feel like too much all at once.

🌿 **Let's break this down:**
• What's the biggest stressor right now?
• What's one small thing you can control today?
• When did you last take a real break?

**Quick stress relief options:**
• 5-minute breathing exercise (available in Wellness tab)
• Progressive muscle relaxation
• Call or text someone who makes you feel supported
• Take a short walk outside

Sometimes stress feels overwhelming because we're trying to handle everything at once. Breaking it into smaller pieces can help it feel more manageable.

What would be most helpful for you right now - talking through what's stressing you, trying a relaxation technique, or exploring longer-term stress management strategies?`;
  }

  // Study/academic related responses
  if (lowerMessage.includes('exam') || lowerMessage.includes('study') || lowerMessage.includes('academic')) {
    return `Academic pressure is one of the biggest stressors for university students. The combination of high expectations, competition, and uncertainty about the future can feel overwhelming.

📚 **Academic wellness strategies:**
• Use the 50/10 rule: 50 minutes focused study, 10 minute break
• Practice self-compassion - you're learning, not performing
• Remember that grades don't define your worth as a person
• Take care of your basic needs: sleep, food, movement, social connection

**For exam anxiety specifically:**
• Try the 4-7-8 breathing technique before studying
• Use positive self-talk: "I am prepared" instead of "I might fail"
• Visualize success, not just worry about failure

What specific academic challenges are you facing? Sometimes having a plan can reduce that overwhelming feeling. You might also benefit from talking to a therapist about academic anxiety - it's very treatable with the right support.`;
  }

  // Default supportive responses
  const supportiveResponses = [
    `Thank you for reaching out and sharing with me. It takes strength to seek support, and I'm glad you're here. University life can bring so many challenges - academic pressure, social changes, figuring out your future - and it's completely normal to need someone to talk to.

What's been on your mind lately? I'm here to listen and support you through whatever you're experiencing. We can explore coping strategies, talk through your feelings, or I can help you connect with additional resources if that would be helpful.

Remember, seeking support is a sign of wisdom and self-care, not weakness. 💙`,

    `I'm here to support you, and I'm glad you felt comfortable reaching out. Everyone's mental health journey is unique, and there's no "right" way to feel or cope with life's challenges.

Whether you're dealing with stress, anxiety, relationship issues, academic pressure, or just need someone to listen, this is a safe space for you. 

What would be most helpful for you right now? We could:
• Talk through what you're experiencing
• Try some wellness exercises together
• Explore therapy techniques
• Discuss when it might be helpful to connect with a professional therapist

You're not alone in this. 🌟`,

    `Hi there! I'm really glad you decided to start a conversation with me today. Taking care of your mental health is one of the most important things you can do, especially during your university years when there's so much change and growth happening.

I'm here to provide support, suggest coping strategies, and help you navigate whatever challenges you're facing. Whether it's stress, anxiety, relationship concerns, academic pressure, or just needing someone to talk to - this is your space.

What's bringing you here today? I'm listening with compassion and without judgment. 💚`
  ];

  return supportiveResponses[Math.floor(Math.random() * supportiveResponses.length)];
}