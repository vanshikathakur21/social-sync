export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // Parse JSON from request
    const data = await request.json();
    
    if (!data) {
      return new Response(JSON.stringify({
        success: false,
        error: "No JSON data received"
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // Extract data
    const {
      age,
      country,
      state,
      interests,
      tone,
      perspective,
      hookline
    } = data;

    // Validate required fields
    const requiredFields = ["age", "country", "state", "interests", "tone", "perspective", "hookline"];
    const missingFields = requiredFields.filter(field => !data[field] || String(data[field]).trim() === "");
    
    if (missingFields.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Validate age
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      return new Response(JSON.stringify({
        success: false,
        error: "Age must be between 1 and 120"
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const prompt = `Generate a ${tone} social media post for a ${age}-year-old from ${state}, ${country}, interested in ${interests}. The perspective should be ${perspective}. Start with: "${hookline}"`;

    // OpenAI API call
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a social media content expert. Generate engaging, authentic social media posts that match the specified tone and perspective."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      return new Response(JSON.stringify({
        success: false,
        error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const openaiData = await openaiResponse.json();
    const post = openaiData.choices[0].message.content.trim();

    return new Response(JSON.stringify({
      success: true,
      prompt: prompt,
      post: post
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Server error: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle OPTIONS preflight requests for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}