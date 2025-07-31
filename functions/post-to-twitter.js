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
    
    const postText = data.post;
    
    if (!postText || postText.trim() === "") {
      return new Response(JSON.stringify({
        success: false,
        error: "No post text provided"
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Ensure the post is within Twitter's character limit (280 characters)
    let tweetText = postText;
    if (tweetText.length > 280) {
      tweetText = tweetText.substring(0, 277) + "...";
    }

    // Create OAuth 1.0a signature for Twitter API v2
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Twitter API v2 endpoint
    const url = 'https://api.twitter.com/2/tweets';
    const method = 'POST';
    
    // OAuth parameters
    const oauthParams = {
      oauth_consumer_key: env.TWITTER_API_KEY,
      oauth_token: env.TWITTER_ACCESS_TOKEN,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0'
    };

    // Create parameter string for signature
    const paramString = Object.keys(oauthParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
      .join('&');

    // Create signature base string
    const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

    // Create signing key
    const signingKey = `${encodeURIComponent(env.TWITTER_API_SECRET)}&${encodeURIComponent(env.TWITTER_ACCESS_SECRET)}`;

    // Create OAuth signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(signingKey);
    const messageData = encoder.encode(signatureBaseString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    // Create OAuth header
    const oauthHeader = `OAuth oauth_consumer_key="${encodeURIComponent(env.TWITTER_API_KEY)}", ` +
      `oauth_token="${encodeURIComponent(env.TWITTER_ACCESS_TOKEN)}", ` +
      `oauth_signature_method="HMAC-SHA1", ` +
      `oauth_timestamp="${timestamp}", ` +
      `oauth_nonce="${nonce}", ` +
      `oauth_version="1.0", ` +
      `oauth_signature="${encodeURIComponent(signatureBase64)}"`;

    // Make the Twitter API request
    const twitterResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': oauthHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: tweetText
      })
    });

    if (!twitterResponse.ok) {
      const errorData = await twitterResponse.json();
      console.error('Twitter API error:', errorData);
      return new Response(JSON.stringify({
        success: false,
        error: `Twitter posting failed: ${errorData.detail || errorData.title || 'Unknown error'}`
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const twitterData = await twitterResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      message: "Post successfully shared on Twitter!",
      tweet_id: twitterData.data.id,
      tweet_url: `https://twitter.com/user/status/${twitterData.data.id}`
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