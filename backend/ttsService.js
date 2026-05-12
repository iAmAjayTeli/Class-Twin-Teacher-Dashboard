/**
 * @module ttsService
 * @description Google Cloud Text-to-Speech service for ClassTwin Lingua.
 *              Generates natural-sounding audio using Neural2 voices
 *              for Indian regional languages.
 */

require('dotenv').config();

// ═══════════════════════════════════════════════
// Neural2 Voice Mapping (natural, human-like)
// ═══════════════════════════════════════════════

const VOICE_MAP = {
  'en': { languageCode: 'en-IN', name: 'en-IN-Neural2-A', ssmlGender: 'FEMALE' },
  'hi': { languageCode: 'hi-IN', name: 'hi-IN-Neural2-D', ssmlGender: 'FEMALE' },
  'kn': { languageCode: 'kn-IN', name: 'kn-IN-Neural2-A', ssmlGender: 'FEMALE' },
  'ta': { languageCode: 'ta-IN', name: 'ta-IN-Neural2-A', ssmlGender: 'FEMALE' },
  'te': { languageCode: 'te-IN', name: 'te-IN-Neural2-A', ssmlGender: 'FEMALE' },
  'ml': { languageCode: 'ml-IN', name: 'ml-IN-Neural2-A', ssmlGender: 'FEMALE' },
  'mr': { languageCode: 'mr-IN', name: 'mr-IN-Neural2-A', ssmlGender: 'FEMALE' },
  'gu': { languageCode: 'gu-IN', name: 'gu-IN-Neural2-A', ssmlGender: 'FEMALE' },
  'bn': { languageCode: 'bn-IN', name: 'bn-IN-Neural2-A', ssmlGender: 'FEMALE' },
};

// In-memory cache: "lang:text" → base64 audio
const audioCache = new Map();
const MAX_AUDIO_CACHE = 200;

/**
 * Synthesize speech audio from text using Google Cloud TTS Neural2 voices.
 * @param {string} text - Text to speak
 * @param {string} langCode - Language code (e.g., 'kn', 'hi')
 * @returns {Promise<string|null>} Base64-encoded MP3 audio, or null on failure
 */
async function synthesizeSpeech(text, langCode = 'en') {
  if (!text || !text.trim()) return null;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ No API key for TTS');
    return null;
  }

  // Check cache
  const cacheKey = `${langCode}:${text.trim().toLowerCase().slice(0, 100)}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey);
  }

  const voice = VOICE_MAP[langCode] || VOICE_MAP['en'];

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: text.trim() },
          voice: {
            languageCode: voice.languageCode,
            name: voice.name,
            ssmlGender: voice.ssmlGender,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0,
            sampleRateHertz: 24000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`❌ Cloud TTS failed (${response.status}):`, errBody.slice(0, 200));
      return null;
    }

    const data = await response.json();
    const audioBase64 = data.audioContent;

    if (audioBase64) {
      // Cache it
      if (audioCache.size >= MAX_AUDIO_CACHE) {
        const firstKey = audioCache.keys().next().value;
        audioCache.delete(firstKey);
      }
      audioCache.set(cacheKey, audioBase64);
    }

    return audioBase64 || null;
  } catch (err) {
    console.error('❌ Cloud TTS error:', err.message);
    return null;
  }
}

/**
 * Generate audio for multiple languages in parallel.
 * @param {Object} translations - { langCode: translatedText }
 * @returns {Promise<Object>} { langCode: base64Audio } (only for successful ones)
 */
async function synthesizeBatch(translations) {
  const entries = Object.entries(translations).filter(
    ([lang, text]) => lang !== 'en' && text && text.trim()
  );

  if (entries.length === 0) return {};

  const results = await Promise.allSettled(
    entries.map(async ([lang, text]) => {
      const audio = await synthesizeSpeech(text, lang);
      return { lang, audio };
    })
  );

  const audioMap = {};
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.audio) {
      audioMap[result.value.lang] = result.value.audio;
    }
  }

  return audioMap;
}

module.exports = { synthesizeSpeech, synthesizeBatch, VOICE_MAP };
