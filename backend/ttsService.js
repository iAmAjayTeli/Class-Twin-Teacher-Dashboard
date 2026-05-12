/**
 * @module ttsService
 * @description Gemini-powered Text-to-Speech service for ClassTwin Lingua.
 *              Uses the gemini-2.5-flash-preview-tts model for natural,
 *              human-like voice synthesis across Indian regional languages.
 */

require('dotenv').config();

// ═══════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════

const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`;
const VOICE_NAME = 'Aoede'; // Natural female voice, works well for Indian languages

// In-memory cache: "lang:text" → base64 WAV audio
const audioCache = new Map();
const MAX_AUDIO_CACHE = 200;

/**
 * Convert raw PCM (L16, 24kHz, mono) to WAV format.
 * WAV is universally supported by mobile audio players.
 */
function pcmToWav(pcmBase64) {
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');
  const numChannels = 1;
  const sampleRate = 24000;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;

  // WAV header (44 bytes)
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);                          // ChunkID
  header.writeUInt32LE(36 + dataSize, 4);            // ChunkSize
  header.write('WAVE', 8);                           // Format
  header.write('fmt ', 12);                          // Subchunk1ID
  header.writeUInt32LE(16, 16);                      // Subchunk1Size (PCM)
  header.writeUInt16LE(1, 20);                       // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);             // NumChannels
  header.writeUInt32LE(sampleRate, 24);              // SampleRate
  header.writeUInt32LE(byteRate, 28);                // ByteRate
  header.writeUInt16LE(blockAlign, 32);              // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34);           // BitsPerSample
  header.write('data', 36);                          // Subchunk2ID
  header.writeUInt32LE(dataSize, 40);                // Subchunk2Size

  const wavBuffer = Buffer.concat([header, pcmBuffer]);
  return wavBuffer.toString('base64');
}

/**
 * Synthesize speech audio from text using Gemini TTS.
 * @param {string} text - Text to speak
 * @param {string} langCode - Language code (for cache key only; Gemini auto-detects)
 * @returns {Promise<string|null>} Base64-encoded WAV audio, or null on failure
 */
async function synthesizeSpeech(text, langCode = 'en') {
  if (!text || !text.trim()) return null;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ No GEMINI_API_KEY for TTS');
    return null;
  }

  // Check cache
  const cacheKey = `${langCode}:${text.trim().toLowerCase().slice(0, 100)}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey);
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: text.trim() }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: VOICE_NAME,
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ Gemini TTS failed (${response.status}):`, errText.slice(0, 200));
      return null;
    }

    const data = await response.json();
    const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!inlineData?.data) {
      console.warn('⚠️ Gemini TTS returned no audio for:', text.slice(0, 40));
      return null;
    }

    // Convert PCM to WAV for universal mobile playback
    const wavBase64 = pcmToWav(inlineData.data);

    // Cache it
    if (audioCache.size >= MAX_AUDIO_CACHE) {
      const firstKey = audioCache.keys().next().value;
      audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, wavBase64);

    return wavBase64;
  } catch (err) {
    console.error('❌ Gemini TTS error:', err.message);
    return null;
  }
}

/**
 * Generate audio for multiple languages in parallel.
 * @param {Object} translations - { langCode: translatedText }
 * @returns {Promise<Object>} { langCode: base64WavAudio } (only for successful ones)
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

module.exports = { synthesizeSpeech, synthesizeBatch, VOICE_NAME };
