# 🌐 ClassTwin Lingua — Student App Integration PRD

## For: Student App Developer
## Author: Teacher Dashboard Team
## Date: May 11, 2026
## Status: Ready for Implementation

---

> [!IMPORTANT]
> ## 🚨 Critical Change Required in Student App
> The `join` socket event **must now include `language`** — the student's preferred language code from their account (e.g., `hi`, `kn`, `ta`).
> ```javascript
> // BEFORE (old)
> socket.emit('join', { sessionCode, studentName });
> 
> // AFTER (new — add language from student's account)
> socket.emit('join', { sessionCode, studentName, language: user.preferredLanguage || 'en' });
> ```
> Without this change, all translations will default to Hindi.

---

## 1. Overview

The Teacher Dashboard now supports **real-time audio translation** during live sessions. When a teacher speaks during a live stream, the system:

1. **Captures** the teacher's speech via Web Speech API (browser STT)
2. **Transcribes** it to text in real-time
3. **Translates** the text to all student languages using Gemini AI
4. **Broadcasts** the translations to all connected students via WebSocket

**Your job**: The student app needs to **receive** these translations and **play them as audio** using Text-to-Speech (TTS) in the student's selected language.

---

## 2. What Already Works (Backend Side)

### 2.1 Backend Server
- **URL**: `http://localhost:3001` (or the deployed backend URL)
- **WebSocket**: Socket.io on the same URL
- **All translation logic is handled server-side** — the student app only needs to receive and play

### 2.2 Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| `en` | English | English |
| `hi` | Hindi | हिन्दी |
| `kn` | Kannada | ಕನ್ನಡ |
| `ta` | Tamil | தமிழ் |
| `te` | Telugu | తెలుగు |
| `ml` | Malayalam | മലയാളം |
| `mr` | Marathi | मराठी |
| `gu` | Gujarati | ગુજરાતી |
| `bn` | Bengali | বাংলা |

### 2.3 API Endpoint to Fetch Languages
```
GET http://localhost:3001/api/languages
```
**Response:**
```json
{
  "languages": [
    { "code": "en", "name": "English", "native": "English" },
    { "code": "hi", "name": "Hindi", "native": "हिन्दी" },
    ...
  ]
}
```

---

## 3. What the Student App Must Implement

### 3.1 Language Selection Screen

**When**: After the student joins a session (enters name + session code) and before entering the live classroom.

**UI Requirements**:
- Show a language picker with all supported languages (fetch from `/api/languages`)
- Display both native name and English name for each language
- Default selection: English (`en`)
- Store the selected language code in the app state (e.g., `preferredLanguage`)
- This selection should be changeable during the session too (small dropdown/icon in the toolbar)

**Example UI flow**:
```
Join Session → Enter Name → Select Language → Enter Live Classroom
```

### 3.2 WebSocket: Listen for `translated_content` Event

The student app already connects to the backend via Socket.io and joins the session room:

```javascript
socket.emit('join', { sessionCode, studentName });
socket.join(`session-${sessionCode}`);
```

**NEW**: Add a listener for the `translated_content` event:

```javascript
socket.on('translated_content', (data) => {
  // data structure:
  // {
  //   originalText: "Today we will learn about photosynthesis",
  //   sourceLang: "en",
  //   translations: {
  //     "en": "Today we will learn about photosynthesis",
  //     "hi": "आज हम प्रकाश संश्लेषण के बारे में सीखेंगे",
  //     "kn": "ಇಂದು ನಾವು ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಬಗ್ಗೆ ಕಲಿಯೋಣ",
  //     "ta": "இன்று நாம் ஒளிச்சேர்க்கை பற்றி கற்போம்"
  //   },
  //   timestamp: 1715443200000
  // }

  const myLanguage = getPreferredLanguage(); // e.g., "hi"
  const textToSpeak = data.translations[myLanguage] || data.originalText;
  
  // 1. Show as live caption/subtitle on screen
  showCaption(textToSpeak, myLanguage);
  
  // 2. Speak aloud using TTS
  speakText(textToSpeak, myLanguage);
});
```

### 3.3 Text-to-Speech (TTS) Implementation

Use the **Web Speech Synthesis API** (works in Electron/Chromium):

```javascript
// TTS Language code mapping (BCP 47 format for SpeechSynthesis)
const TTS_LANG_MAP = {
  'en': 'en-IN',    // English (India)
  'hi': 'hi-IN',    // Hindi
  'kn': 'kn-IN',    // Kannada
  'ta': 'ta-IN',    // Tamil
  'te': 'te-IN',    // Telugu
  'ml': 'ml-IN',    // Malayalam
  'mr': 'mr-IN',    // Marathi
  'gu': 'gu-IN',    // Gujarati
  'bn': 'bn-IN',    // Bengali
};

let currentUtterance = null;
const speechQueue = [];
let isSpeaking = false;

/**
 * Speak translated text aloud using Web Speech Synthesis.
 * Uses a queue to prevent overlapping speech.
 */
function speakText(text, langCode) {
  if (!text || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = TTS_LANG_MAP[langCode] || 'en-IN';
  utterance.rate = 0.9;       // Slightly slower for clarity
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Try to find a voice that matches the language
  const voices = window.speechSynthesis.getVoices();
  const matchingVoice = voices.find(v => v.lang.startsWith(langCode));
  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  // Queue management — don't overlap
  speechQueue.push(utterance);
  processQueue();
}

function processQueue() {
  if (isSpeaking || speechQueue.length === 0) return;
  
  isSpeaking = true;
  const utterance = speechQueue.shift();
  
  utterance.onend = () => {
    isSpeaking = false;
    processQueue(); // Process next in queue
  };
  
  utterance.onerror = () => {
    isSpeaking = false;
    processQueue();
  };

  // Cancel any previous speech before starting new one
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/**
 * Stop all TTS playback
 */
function stopSpeaking() {
  speechQueue.length = 0;
  isSpeaking = false;
  window.speechSynthesis.cancel();
}
```

### 3.4 Live Captions / Subtitles UI

Display the translated text as **live captions** overlaid on the video stream or below it.

**UI Requirements**:
- Show captions at the bottom of the video area (like subtitles)
- Fade out after 5-8 seconds
- Show a small language badge (e.g., "🇮🇳 हिन्दी") next to the caption
- Optionally show original English text in smaller font above the translation
- Allow students to toggle captions on/off
- Allow students to toggle audio (TTS) on/off independently

**Suggested component structure**:
```
┌─────────────────────────────────────────────┐
│                                             │
│            Teacher Video Stream             │
│                                             │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 🇬🇧 "Today we learn photosynthesis" │    │ ← Original (small, faded)
│  │ 🇮🇳 "आज हम प्रकाश संश्लेषण सीखेंगे"   │    │ ← Translation (large, bold)
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
│ 🔊 Audio ON │ 💬 Captions ON │ 🌐 Hindi ▾  │  ← Controls
└─────────────────────────────────────────────┘
```

### 3.5 Controls the Student Should Have

| Control | Default | Description |
|---------|---------|-------------|
| **Audio Translation** (TTS) | ON | Toggle TTS playback of translations |
| **Captions** | ON | Toggle subtitle display |
| **Language Selector** | Set during join | Change language mid-session |
| **Volume** | 100% | TTS volume control |
| **Speed** | 0.9x | TTS speed (0.5x to 1.5x) |

---

## 4. Data Flow Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────────────┐
│   Teacher     │         │    Server    │         │   Student App    │
│  Dashboard    │         │  (Backend)   │         │   (Your Work)    │
├──────────────┤         ├──────────────┤         ├──────────────────┤
│              │         │              │         │                  │
│ Teacher      │ WS:live │ Translates   │ WS:     │ Receives         │
│ speaks  ────►│ trans.  │ via Gemini   │ transl. │ translations     │
│              │────────►│ to Hi,Kn,Ta  │────────►│                  │
│ Speech-to-   │         │ etc.         │ content │ Shows captions   │
│ Text (STT)   │         │              │         │ Speaks via TTS   │
│              │         │              │         │                  │
└──────────────┘         └──────────────┘         └──────────────────┘
```

---

## 5. WebSocket Event Reference

### Events the Student App Already Handles
These are existing events — **add `language` to the join event**:

| Event | Direction | Data |
|-------|-----------|------|
| `join` | Student → Server | `{ sessionCode, studentName, language }` ⚠️ **ADD `language`** |
| `set_language` | Student → Server | `{ language }` — call when student changes language mid-session |
| `teacher_message` | Server → Student | `{ id, sessionId, message, sentAt }` |
| `quiz_delivery` | Server → Student | `{ questions, roundNumber }` |

### NEW Event to Handle

| Event | Direction | Data |
|-------|-----------|------|
| `translated_content` | Server → Student | See schema below |
| `student_language_changed` | Server → Teacher | `{ studentId, language }` — FYI, handled by teacher dashboard |

**`translated_content` payload schema:**
```typescript
{
  originalText: string;       // Teacher's original speech in English
  sourceLang: string;         // Source language code, typically "en"
  translations: {             // Map of language code → translated text
    [langCode: string]: string;
    // Example:
    // "en": "Today we learn photosynthesis",
    // "hi": "आज हम प्रकाश संश्लेषण सीखेंगे",
    // "kn": "ಇಂದು ನಾವು ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಬಗ್ಗೆ ಕಲಿಯೋಣ"
  };
  timestamp: number;          // Unix timestamp in milliseconds
}
```

---

## 6. Edge Cases to Handle

| Scenario | How to Handle |
|----------|---------------|
| Student's language not in translations | Fall back to `originalText` (English) |
| TTS voice not available for language | Show caption only, hide audio toggle |
| Multiple translations arrive quickly | Queue them — don't overlap speech |
| Student changes language mid-session | Update preference, next translation uses new language |
| Network disconnect during translation | Cache last few captions, resume when reconnected |
| Teacher stops translation mid-session | Hide caption UI, stop TTS |
| Browser TTS blocked (autoplay policy) | Show "Enable Audio" button that user must click first |

### Important: Browser Autoplay Policy
Most browsers block `SpeechSynthesis` until the user interacts with the page. Add a **one-time "Enable Audio" button** that the student clicks when they enter the session. This satisfies the browser's autoplay requirements.

```javascript
// Call this on the first user interaction (e.g., "Join Session" button click)
function unlockAudio() {
  const utterance = new SpeechSynthesisUtterance('');
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
}
```

---

## 7. Testing Guide

### 7.1 Manual Testing Steps

1. **Start a session** from the Teacher Dashboard (`http://localhost:5173`)
2. **Join from student app** with a session code
3. **Select Hindi** (or any non-English language) during join
4. **Teacher goes live** and clicks "Start" on the Live Audio Translation panel
5. **Teacher speaks** — verify:
   - ✅ Caption appears on student app in Hindi
   - ✅ TTS speaks the Hindi translation aloud
   - ✅ Original English text shown as subtitle
   - ✅ Multiple sentences queue properly
   - ✅ Language change mid-session works

### 7.2 Testing Without Teacher Dashboard

You can simulate `translated_content` events directly:

```javascript
// In your student app's browser console:
socket.emit('test_translate', {
  originalText: "Hello students, today we will learn about the solar system",
  translations: {
    "en": "Hello students, today we will learn about the solar system",
    "hi": "नमस्ते छात्रों, आज हम सौर मंडल के बारे में सीखेंगे"
  }
});
```

Or use the translation API directly:
```bash
curl -X POST http://localhost:3001/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Good morning students", "sourceLang": "en", "targetLang": "hi"}'
```

**Response:**
```json
{
  "translatedText": "सुप्रभात छात्रों",
  "sourceLang": "en",
  "targetLang": "hi"
}
```

---

## 8. Dependencies

- **Socket.io Client** — Already in the student app
- **Web Speech Synthesis API** — Built into Chromium/Electron, no install needed
- **No new packages required**

---

## 9. Priority & Timeline

| Task | Priority | Estimated Effort |
|------|----------|-----------------|
| Language selection on join screen | P0 | 2-3 hours |
| `translated_content` WebSocket listener | P0 | 1 hour |
| TTS engine with queue management | P0 | 2-3 hours |
| Live captions/subtitles UI overlay | P0 | 3-4 hours |
| Controls (toggle audio/captions/language) | P1 | 2-3 hours |
| Edge case handling & polish | P1 | 2-3 hours |
| **Total** | | **~12-16 hours** |

---

## 10. Questions? Contact

- **Backend API issues**: Check server logs at `http://localhost:3001`
- **WebSocket not connecting**: Ensure the student app connects to the correct backend URL
- **Translation quality issues**: We use Gemini 2.0 Flash — quality is generally good but can be improved by switching to Gemini Pro if needed
- **Missing language support**: Currently 9 languages — can be extended by adding to `SUPPORTED_LANGUAGES` in `backend/translationService.js`
