from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import openai
import tweepy
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["*"])

# OpenAI API Key - Replace with your actual key
openai.api_key = "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"

# === Twitter API Setup ===
auth = tweepy.OAuth1UserHandler(
    "7RHZ8QbyXlAcrJzMrTli5QdD4",  # API Key
    "fIfbEmExlLpJk1qEU8ZRSB4vkKNOgyst5IE2QDxfriiYGUxLsq",  # API Secret
    "1921236407311626240-w3LUisOEiitQsSieJulDZRuMCsrset",  # Access Token
    "jsyFTOjTa116gIjbSxp8NvyuaxZaRpJaQ3VpCta6wjdn7"  # Access Secret
)
twitter_api = tweepy.API(auth)

@app.route('/')
def home():
    try:
        return send_from_directory('.', 'social-form.html')
    except FileNotFoundError:
        return jsonify({"error": "social-form.html not found"}), 404

@app.route('/social-form.html')
def social_form():
    try:
        return send_from_directory('.', 'social-form.html')
    except FileNotFoundError:
        return jsonify({"error": "social-form.html not found"}), 404

@app.route("/generate", methods=["POST"])
def generate():
    try:
        logger.info("Received generate request")
        data = request.get_json()
        
        if data is None:
            logger.error("No JSON data received")
            return jsonify({
                "success": False,
                "error": "No JSON data received"
            }), 400
        
        # Extract data
        age = data.get("age")
        country = data.get("country")
        state = data.get("state")
        interests = data.get("interests")
        tone = data.get("tone")
        perspective = data.get("perspective")
        hookline = data.get("hookline")

        # Validate required fields
        required_fields = ["age", "country", "state", "interests", "tone", "perspective", "hookline"]
        missing_fields = [field for field in required_fields if not data.get(field) or str(data.get(field)).strip() == ""]
        
        if missing_fields:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400

        # Validate age
        try:
            age_num = int(age)
            if age_num < 1 or age_num > 120:
                return jsonify({
                    "success": False,
                    "error": "Age must be between 1 and 120"
                }), 400
        except ValueError:
            return jsonify({
                "success": False,
                "error": "Age must be a valid number"
            }), 400

        prompt = f"Generate a {tone} social media post for a {age}-year-old from {state}, {country}, interested in {interests}. The perspective should be {perspective}. Start with: \"{hookline}\""

        # OpenAI API call
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a social media content expert. Generate engaging, authentic social media posts that match the specified tone and perspective."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.7
        )
        post = response.choices[0].message.content.strip()
        logger.info("Successfully generated post")

        return jsonify({
            "success": True,
            "prompt": prompt,
            "post": post
        })

    except openai.APIError as e:
        logger.error(f"OpenAI API error: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"OpenAI API error: {str(e)}"
        }), 500
    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}"
        }), 500

@app.route("/post-to-twitter", methods=["POST"])
def post_to_twitter():
    try:
        logger.info("Received Twitter posting request")
        data = request.get_json()
        
        if data is None:
            logger.error("No JSON data received")
            return jsonify({
                "success": False,
                "error": "No JSON data received"
            }), 400
        
        post_text = data.get("post")
        
        if not post_text or post_text.strip() == "":
            return jsonify({
                "success": False,
                "error": "No post text provided"
            }), 400

        # Post to Twitter
        try:
            # Ensure the post is within Twitter's character limit (280 characters)
            if len(post_text) > 280:
                post_text = post_text[:277] + "..."
            
            # Post the tweet
            tweet = twitter_api.update_status(post_text)
            logger.info(f"Successfully posted to Twitter: {tweet.id}")
            
            return jsonify({
                "success": True,
                "message": "Post successfully shared on Twitter!",
                "tweet_id": tweet.id,
                "tweet_url": f"https://twitter.com/user/status/{tweet.id}"
            })
            
        except tweepy.errors.TweepyException as e:
            logger.error(f"Twitter API error: {str(e)}")
            return jsonify({
                "success": False,
                "error": f"Twitter posting failed: {str(e)}"
            }), 500
            
    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}"
        }), 500

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Backend is running",
        "version": "1.0.0"
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
