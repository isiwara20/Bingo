/**
 * Test script to validate Gemini API keys
 * Run: node test-gemini-keys.js
 */

require('dotenv').config();

const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

async function testKey(apiKey, index) {
  console.log(`\n🔑 Testing Key ${index + 1}...`);
  console.log(`   Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  
  const body = {
    contents: [
      {
        parts: [
          { text: "Say 'Hello' if you can read this message." }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 50,
    }
  };

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.log(`   ❌ FAILED: ${error?.error?.message || 'Unknown error'}`);
      return false;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (text) {
      console.log(`   ✅ SUCCESS: API responded with "${text.trim()}"`);
      return true;
    } else {
      console.log(`   ⚠️  WARNING: API responded but no text returned`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 BinGo - Gemini API Key Validator');
  console.log('='.repeat(60));

  if (API_KEYS.length === 0) {
    console.log('\n❌ No API keys found in .env file!');
    console.log('\n📝 Please add your Gemini API keys to mobile/.env:');
    console.log('   GEMINI_API_KEY=AIzaSy...');
    console.log('   GEMINI_API_KEY_2=AIzaSy...');
    console.log('   GEMINI_API_KEY_3=AIzaSy...');
    console.log('\n🔗 Get keys from: https://aistudio.google.com/app/apikey\n');
    process.exit(1);
  }

  console.log(`\n📊 Found ${API_KEYS.length} API key(s) in .env file\n`);

  // Validate key format
  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];
    if (!key.startsWith('AIza')) {
      console.log(`⚠️  Key ${i + 1} has invalid format (should start with "AIza")`);
      console.log(`   Current: ${key.substring(0, 15)}...`);
    }
  }

  // Test each key
  const results = [];
  for (let i = 0; i < API_KEYS.length; i++) {
    const isValid = await testKey(API_KEYS[i], i);
    results.push(isValid);
    
    // Small delay between requests
    if (i < API_KEYS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));
  
  const validCount = results.filter(Boolean).length;
  console.log(`\n✅ Valid keys: ${validCount}/${API_KEYS.length}`);
  
  if (validCount === 0) {
    console.log('\n❌ No valid keys! Your app will NOT work.');
    console.log('   Please check your API keys and try again.');
  } else if (validCount < API_KEYS.length) {
    console.log('\n⚠️  Some keys are invalid. Your app will work but with');
    console.log('   reduced rate limit capacity.');
  } else {
    console.log('\n🎉 All keys are valid! Your app is ready to use.');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
