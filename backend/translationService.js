/**
 * @module translationService
 * @description Gemini-powered translation service for ClassTwin Lingua.
 *              Provides real-time text translation between English and
 *              regional Indian languages using the Gemini API.
 *              Includes in-memory LRU cache to avoid redundant API calls.
 */

require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// ═══════════════════════════════════════════════
// Supported Languages
// ═══════════════════════════════════════════════

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
];

function getLanguageName(code) {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang ? lang.name : code;
}

// ═══════════════════════════════════════════════
// Translation Cache (LRU-style, max 500 entries)
// ═══════════════════════════════════════════════

const MAX_CACHE_SIZE = 500;
const translationCache = new Map();

function getCacheKey(text, sourceLang, targetLang) {
  return `${sourceLang}:${targetLang}:${text.trim().toLowerCase()}`;
}

function getCached(text, sourceLang, targetLang) {
  const key = getCacheKey(text, sourceLang, targetLang);
  if (translationCache.has(key)) {
    const val = translationCache.get(key);
    // Move to end (most recently used)
    translationCache.delete(key);
    translationCache.set(key, val);
    return val;
  }
  return null;
}

function setCache(text, sourceLang, targetLang, translated) {
  const key = getCacheKey(text, sourceLang, targetLang);
  // Evict oldest if at capacity
  if (translationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
  translationCache.set(key, translated);
}

// ═══════════════════════════════════════════════
// Gemini Translation
// ═══════════════════════════════════════════════

/**
 * Translate text from one language to another using Gemini.
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code (e.g., 'en')
 * @param {string} targetLang - Target language code (e.g., 'hi')
 * @returns {Promise<string>} Translated text
 */
async function translateText(text, sourceLang = 'en', targetLang = 'hi') {
  // No-op if same language
  if (sourceLang === targetLang) return text;
  if (!text || !text.trim()) return text;

  // Check cache first
  const cached = getCached(text, sourceLang, targetLang);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not set, returning original text');
    return text;
  }

  const sourceLanguageName = getLanguageName(sourceLang);
  const targetLanguageName = getLanguageName(targetLang);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a precise translator for an educational platform. Translate the following text from ${sourceLanguageName} to ${targetLanguageName}. 

Rules:
- Return ONLY the translated text, nothing else
- Preserve formatting (line breaks, bullet points, etc.)
- Keep technical terms, proper nouns, and code in English
- Use simple, clear language suitable for students
- Do NOT add any explanation, notes, or prefixes

Text to translate:
${text}`,
    });

    const translated = (response.text || text).trim();
    
    // Cache the result
    setCache(text, sourceLang, targetLang, translated);
    
    return translated;
  } catch (err) {
    console.error(`Translation error (${sourceLang}→${targetLang}):`, err.message);
    return text; // Fallback to original
  }
}

/**
 * Translate text into multiple target languages in parallel.
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string[]} targetLangs - Array of target language codes
 * @returns {Promise<Object>} Map of { langCode: translatedText }
 */
async function translateBatch(text, sourceLang = 'en', targetLangs = []) {
  if (!text || !text.trim()) return {};

  // Filter out source language and deduplicate
  const uniqueTargets = [...new Set(targetLangs.filter(t => t !== sourceLang))];
  
  if (uniqueTargets.length === 0) return {};

  // Run all translations in parallel
  const results = await Promise.allSettled(
    uniqueTargets.map(async (targetLang) => {
      const translated = await translateText(text, sourceLang, targetLang);
      return { lang: targetLang, text: translated };
    })
  );

  const translations = {};
  translations[sourceLang] = text; // Include original

  for (const result of results) {
    if (result.status === 'fulfilled') {
      translations[result.value.lang] = result.value.text;
    }
  }

  return translations;
}

/**
 * Detect the language of input text using Gemini.
 * @param {string} text - Text to detect language of
 * @returns {Promise<string>} Language code (e.g., 'hi', 'en')
 */
async function detectLanguage(text) {
  if (!text || !text.trim()) return 'en';

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return 'en';

  try {
    const ai = new GoogleGenAI({ apiKey });
    const langCodes = SUPPORTED_LANGUAGES.map(l => l.code).join(', ');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Detect the language of the following text. Respond with ONLY the language code from this list: ${langCodes}. If unsure, respond with "en".

Text: "${text.slice(0, 200)}"`,
    });

    const detected = (response.text || 'en').trim().toLowerCase();
    // Validate it's a supported language code
    if (SUPPORTED_LANGUAGES.some(l => l.code === detected)) {
      return detected;
    }
    return 'en';
  } catch (err) {
    console.error('Language detection error:', err.message);
    return 'en';
  }
}

module.exports = {
  translateText,
  translateBatch,
  detectLanguage,
  SUPPORTED_LANGUAGES,
  getLanguageName,
};
