# Simplified AI Interviewer Flow - Direct User Input

## 🎯 Simplified System Architecture

```
┌─────────────────────────────────┐
│    User Browser (Frontend)      │
│  ┌──────────────────────────┐  │
│  │  Simple Input Form       │  │
│  │  CV Upload (optional)    │  │
│  │  Level Select            │  │
│  │  Live Interview          │  │
│  └──────────────────────────┘  │
└──────────┬──────────────────────┘
           │
           ↓
┌──────────────────────────────────┐
│   Backend Server (Simple)        │
│  ┌────────────────────────────┐ │
│  │  Pass-through to Gemini    │ │
│  │  Simple CV Parser          │ │
│  │  Session Manager           │ │
│  └────────────────────────────┘ │
│       │         │         │      │
│       ↓         ↓         ↓      │
│  ┌────────┐ ┌───────┐ ┌────┐   │
│  │ Gemini │ │ Tavus │ │ DB │   │
│  └────────┘ └───────┘ └────┘   │
└──────────────────────────────────┘
```

---

## 📋 SIMPLIFIED TECHNICAL FLOW

### **PHASE 1: Pre-Interview Setup (Minimal)**

#### **Step 1: User Input Page**

**Frontend - Single Simple Form:**

```html
┌─────────────────────────────────────┐
│  AI Interview Setup                 │
└─────────────────────────────────────┘

What skill/topic for interview?
[_________________________________]
(e.g., Python, Marketing, Leadership)


Upload CV (Optional)
[Choose File] or [Drag & Drop]


Interview Level
○ Beginner    ○ Intermediate    ○ Advanced


[Start Interview]
```

**Frontend Code Structure:**
```javascript
// Simple form data
const formData = {
  skill_topic: "",      // Direct user input, no validation
  cv_file: null,        // Optional
  level: "intermediate" // Default
}

// On submit
function startInterview() {
  // Send directly to backend
  fetch('/api/start-interview', {
    method: 'POST',
    body: formData
  })
}
```

---

#### **Step 2: Backend Processing (Minimal)**

**Backend receives:**
```json
{
  "skill_topic": "React and Node.js",
  "cv_file": <file_data> or null,
  "level": "intermediate"
}
```

**Backend does:**

1. **Generate Session ID**
   ```python
   session_id = uuid.uuid4()
   ```

2. **Parse CV (if provided) - Simple**
   ```python
   cv_text = ""
   if cv_file:
       # Simple text extraction (no complex analysis)
       cv_text = extract_text_from_pdf(cv_file)
       # Or just pass raw to Gemini later
   ```

3. **Build System Prompt - Direct**
   ```python
   system_prompt = f"""
   You are a professional interviewer conducting a {level} level interview.
   
   Interview Topic: {skill_topic}
   
   {f"Candidate CV: {cv_text}" if cv_text else "No CV provided."}
   
   Instructions:
   - Conduct a {level} level interview on {skill_topic}
   - Ask relevant, clear questions one at a time
   - Be professional and encouraging
   - Duration: approximately 20-30 minutes
   - Start with a greeting and asking the candidate to introduce themselves
   - Adapt questions based on their responses
   - If CV is provided, reference their experience when relevant
   - End with "Do you have any questions for me?"
   
   Keep responses conversational and natural for audio output.
   """
   ```

4. **Store Session**
   ```python
   sessions[session_id] = {
       "skill_topic": skill_topic,
       "level": level,
       "cv_text": cv_text,
       "system_prompt": system_prompt,
       "created_at": timestamp
   }
   ```

5. **Return to Frontend**
   ```json
   {
     "session_id": "abc-123",
     "status": "ready"
   }
   ```

---

### **PHASE 2: Interview Initialization**

#### **Step 3: Setup Tavus & Gemini**

**Backend - Sequential Setup:**

**3a. Initialize Tavus**
```python
# Create Tavus conversation
tavus_response = requests.post(
    'https://api.tavus.io/v1/conversations',
    headers={'x-api-key': TAVUS_KEY},
    json={
        'replica_id': INTERVIEWER_AVATAR_ID,
        'conversation_name': f'Interview_{session_id}'
    }
)

conversation_id = tavus_response.json()['conversation_id']
streaming_url = tavus_response.json()['streaming_url']
```

**3b. Initialize Gemini**
```python
# Create Gemini session with system prompt
gemini = genai.GenerativeModel('gemini-2.0-flash-exp')

chat = gemini.start_chat(
    history=[]
)

# First message: system prompt + start interview
initial_message = system_prompt + "\n\nStart the interview now with a greeting."

response = chat.send_message(
    initial_message,
    generation_config={'response_modalities': ['audio']}
)

# Get greeting audio
greeting_audio = response.candidates[0].content.parts[0].inline_data.data
```

**3c. Send to Frontend**
```json
{
  "tavus_streaming_url": "wss://stream.tavus.io/xyz",
  "initial_greeting_audio": "<base64_audio>",
  "status": "interview_started"
}
```

---

### **PHASE 3: Live Interview Loop**

#### **Step 4: Real-Time Interview Flow**

**Flow Diagram:**
```
User Speaks
    ↓
Frontend captures audio
    ↓
Send to Backend via WebSocket
    ↓
Backend → Gemini (with audio)
    ↓
Gemini processes & responds (audio)
    ↓
Gemini audio → Tavus API
    ↓
Tavus generates avatar video
    ↓
Stream to Frontend
    ↓
Display avatar + play audio
    ↓
Loop back to "User Speaks"
```

**Backend WebSocket Handler:**
```python
@websocket.route('/interview/{session_id}')
async def interview_session(websocket, session_id):
    session = sessions[session_id]
    
    while True:
        # Receive user audio
        user_audio = await websocket.receive_bytes()
        
        # Send to Gemini
        response = chat.send_message(
            {
                'mime_type': 'audio/wav',
                'data': user_audio
            },
            generation_config={'response_modalities': ['audio']}
        )
        
        # Get Gemini's audio response
        gemini_audio = response.candidates[0].content.parts[0].inline_data.data
        
        # Send audio to Tavus for avatar animation
        tavus_video = requests.post(
            f'https://api.tavus.io/v1/conversations/{conversation_id}/speak',
            json={'audio': gemini_audio}
        )
        
        # Stream video back to frontend
        await websocket.send_json({
            'type': 'avatar_response',
            'video_url': tavus_video.json()['video_stream_url'],
            'audio': gemini_audio
        })
        
        # Save conversation turn
        save_turn(session_id, user_audio, gemini_audio)
```

**Gemini Handles Everything:**
- Understanding the topic (from user's simple input)
- Asking relevant questions
- Adapting difficulty to level
- Using CV context naturally
- Managing conversation flow
- Knowing when to end

**No backend logic needed** - Gemini does it all based on system prompt!

---

### **PHASE 4: Interview End**

#### **Step 5: Conclusion**

**User clicks "End Interview" OR Gemini naturally concludes**

**Backend:**
```python
# Close Tavus conversation
requests.delete(
    f'https://api.tavus.io/v1/conversations/{conversation_id}',
    headers={'x-api-key': TAVUS_KEY}
)

# Generate summary (optional)
summary_prompt = f"""
Based on this interview about {skill_topic}:

[Full conversation transcript]

Provide a brief summary:
- Overall performance
- Key strengths
- Areas to improve
- Recommendation
"""

summary = gemini.generate_content(summary_prompt)

# Save everything
save_interview_record(session_id, summary)

# Return to frontend
return {
    'status': 'completed',
    'summary': summary.text
}
```

---

## 👤 SIMPLIFIED USER FLOW

### **User Experience - Step by Step**

**1. Landing (5 seconds)**
```
┌─────────────────────────────────┐
│  AI Interview on Any Topic      │
│                                 │
│  What skill/topic?              │
│  [___________________________]  │
│                                 │
│  Upload CV (optional)           │
│  [Choose File]                  │
│                                 │
│  Level: ○Beg ●Int ○Adv         │
│                                 │
│  [Start Interview]              │
└─────────────────────────────────┘
```

User types: "Python backend"
Uploads CV (or skips)
Clicks Start

---

**2. Permission (2 seconds)**
```
Browser: "Allow camera and microphone?"
User: Clicks "Allow"
```

---

**3. Loading (3 seconds)**
```
┌─────────────────────────────────┐
│  Preparing your interview...    │
│  ⏳                             │
└─────────────────────────────────┘
```

Backend sets up Tavus + Gemini

---

**4. Interview Starts**
```
┌─────────────────────────────────┐
│                                 │
│   [Avatar Video - Speaking]     │
│                                 │
│   "Hi! I'm here to interview    │
│   you on Python backend         │
│   development. Let's start-     │
│   tell me about yourself."      │
│                                 │
└─────────────────────────────────┘
         ┌─────┐
         │ You │  [🎤 Listening]
         └─────┘
         
[End Interview]
```

---

**5. Conversation Flow**
```
Avatar: "Tell me about yourself"
User: [Speaks for 30 seconds]

Avatar: "Great! Let's talk about Django vs FastAPI..."
User: [Responds]

Avatar: "How do you handle database migrations?"
User: [Responds]

[... continues for 10-12 questions ...]

Avatar: "Any questions for me?"
User: "What happens next?"

Avatar: "You'll get feedback in 24 hours. Thanks!"
```

---

**6. End Screen**
```
┌─────────────────────────────────┐
│  Interview Complete! ✓          │
│                                 │
│  Topic: Python backend          │
│  Duration: 23 minutes           │
│                                 │
│  Summary:                       │
│  You demonstrated solid         │
│  understanding of...            │
│                                 │
│  [Download Transcript]          │
│  [Start New Interview]          │
└─────────────────────────────────┘
```

---

## 🔧 MINIMAL IMPLEMENTATION

### **What Backend Actually Does:**

1. ✅ Receive simple form data (skill, CV, level)
2. ✅ Build basic system prompt
3. ✅ Initialize Tavus + Gemini
4. ✅ Pass audio back and forth
5. ✅ Save conversation
6. ✅ Generate summary at end

### **What Backend Does NOT Do:**

❌ Validate user input
❌ Interpret skill semantics
❌ Ask clarification questions
❌ Analyze CV deeply
❌ Generate question categories
❌ Track conversation state
❌ Decide difficulty
❌ Manage question flow

**Gemini handles ALL interview logic** through the simple system prompt!

---

## 💡 Example System Prompts

### **Example 1: User Input "React"**
```
You are a professional interviewer conducting an intermediate level interview.

Interview Topic: React

No CV provided.

Instructions:
- Conduct an intermediate level interview on React
- Ask relevant, clear questions one at a time
- Be professional and encouraging
- Duration: approximately 20-30 minutes
- Start with a greeting and asking the candidate to introduce themselves
- Adapt questions based on their responses
- End with "Do you have any questions for me?"

Keep responses conversational and natural for audio output.
```

Gemini figures out:
- React = frontend framework
- Intermediate = ask about hooks, state management, component design
- No CV = learn about candidate first
- Adapts based on responses

---

### **Example 2: User Input "Digital marketing for startups"**
```
You are a professional interviewer conducting a beginner level interview.

Interview Topic: Digital marketing for startups

Candidate CV: [John Doe, 2 years marketing experience, worked at Tech Startup X...]

Instructions:
- Conduct a beginner level interview on Digital marketing for startups
- Ask relevant, clear questions one at a time
- Be professional and encouraging
- Duration: approximately 20-30 minutes
- Start with a greeting and asking the candidate to introduce themselves
- Adapt questions based on their responses
- If CV is provided, reference their experience when relevant
- End with "Do you have any questions for me?"

Keep responses conversational and natural for audio output.
```

Gemini figures out:
- Digital marketing = SEO, social media, content, ads
- Startups = budget-conscious, growth hacking
- Beginner = fundamentals, basic strategies
- Can reference "Tech Startup X" naturally

---

### **Example 3: User Input "Machine learning neural networks tensorflow"**
```
You are a professional interviewer conducting an advanced level interview.

Interview Topic: Machine learning neural networks tensorflow

No CV provided.

Instructions:
- Conduct an advanced level interview on Machine learning neural networks tensorflow
- Ask relevant, clear questions one at a time
- Be professional and encouraging
- Duration: approximately 20-30 minutes
- Start with a greeting and asking the candidate to introduce themselves
- Adapt questions based on their responses
- End with "Do you have any questions for me?"

Keep responses conversational and natural for audio output.
```

Gemini figures out:
- ML + neural networks + TensorFlow
- Advanced = architecture, training, optimization, deployment
- No CV = assess level through initial questions
- Can go deep into technical details

---

## 🎯 Key Simplification Benefits

✅ **No validation logic** - Gemini interprets any input
✅ **No complex parsing** - Direct pass-through
✅ **No question banks** - Gemini generates contextually
✅ **No state machines** - Gemini manages flow
✅ **No difficulty tracking** - Gemini adapts naturally
✅ **Minimal backend code** - Just orchestration
✅ **Fast to build** - Simple form → API calls → done

**The user's raw input + simple prompt = Gemini does everything!**




Based on my research, here's a comprehensive summary of **Tavus API + Gemini Live API** documentation for your AI interviewer project:

---

## 📚 **TAVUS API DOCUMENTATION SUMMARY**

### **Core Concept: Conversational Video Interface (CVI)**

Tavus provides real-time, face-to-face conversational AI through their CVI platform.

### **Key Features:**
- **Ultra-low latency**: ~600ms response time
- **WebRTC-based**: Real-time audio/video streaming
- **Photorealistic avatars**: Powered by Phoenix-3 rendering model
- **Multimodal**: Supports audio, video, and text input/output
- **30+ languages** supported

### **Creating a Conversation (API Endpoint):**

```bash
POST https://tavusapi.com/v2/conversations

Headers:
  Content-Type: application/json
  x-api-key: YOUR_API_KEY

Body:
{
  "replica_id": "rfe12d8b9597",      // Avatar to use
  "persona_id": "pdced222244b",      // Behavior/personality
  "conversation_name": "Interview Session",
  "conversational_context": "Optional additional context"
}

Response:
{
  "conversation_id": "c123456",
  "conversation_url": "https://tavus.daily.co/c123456",  // WebRTC URL
  "status": "active",
  "created_at": "timestamp"
}
```

### **Persona Configuration:**

Personas define HOW the avatar behaves. You can customize:

```json
{
  "persona_name": "Professional Interviewer",
  "system_prompt": "You are conducting a job interview...",
  "context": "Background knowledge for the persona",
  "default_replica_id": "replica_id",
  "layers": {
    "llm": {
      "model": "custom-model-name",
      "base_url": "https://api.provider.com",
      "api_key": "key"
    },
    "tts": { /* custom TTS config */ },
    "perception": { /* vision settings */ }
  }
}
```

### **Pipeline Modes:**

**1. Full CVI Pipeline (Default - Recommended):**
- Tavus handles: STT → LLM → TTS → Avatar rendering
- Lowest latency (~600ms)
- Use Tavus's optimized models

**2. Custom LLM Mode:**
- Bring your own LLM (like Gemini!)
- Tavus handles: STT → Your LLM → TTS → Avatar
- Configure in `layers.llm`

**3. Echo Mode:**
- You provide audio directly to avatar
- Avatar just lip-syncs your audio
- **This is what you'd use for Gemini integration!**

### **Echo Mode for Gemini Integration:**

In the persona configuration:
```json
{
  "layers": {
    "transport": {
      "microphone": false  // Disable mic, you'll send audio via API
    }
  }
}
```

Then send audio to avatar:
```bash
POST https://tavusapi.com/v2/conversations/{conversation_id}/speak

Body:
{
  "audio": "base64_encoded_audio"  // From Gemini
}
```

### **Free Tier Limits:**
- ✅ **25 conversational minutes/month**
- ✅ **5 video generation minutes/month**
- ✅ API access included
- ✅ Stock replicas available
- ❌ No custom replica training (requires paid plan)
- Overage: **$0.37/minute**

### **WebRTC Integration:**

The `conversation_url` is a Daily.co room. You can:
1. **Embed via iframe**: Simple, quick
2. **Use Daily SDK**: Full control over UI/UX
3. **Use Tavus React components**: Pre-built UI

---

## 📚 **GEMINI LIVE API DOCUMENTATION SUMMARY**

### **Core Concept: Native Audio**

Gemini 2.5 Flash Native Audio processes audio natively (no separate STT/TTS needed).

### **Model Name:**
```
gemini-2.5-flash-native-audio-preview-12-2025
```

### **Key Features:**
- **Native audio I/O**: Audio in → Audio out (no pipeline)
- **Sub-second latency**: Real-time conversational
- **Multimodal**: Can handle audio + video + text simultaneously
- **30 HD voices** in 24 languages
- **Affective Dialog**: Understands emotional tone
- **Function calling** supported
- **Thinking mode** available

### **Connection Method: WebSocket**

```python
from google import genai
import asyncio

client = genai.Client()

MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"

CONFIG = {
    "response_modalities": ["AUDIO"],  # Get audio back
    "system_instruction": "You are a professional interviewer conducting an interview on {topic}. Level: {level}."
}

async def main():
    async with client.aio.live.connect(model=MODEL, config=CONFIG) as session:
        # Send audio chunk
        await session.send(audio_chunk, end_of_turn=False)
        
        # Receive audio response
        async for response in session.receive():
            if response.server_content.model_turn:
                for part in response.server_content.model_turn.parts:
                    if part.inline_data:
                        audio_output = part.inline_data.data  # base64
```

### **Audio Format Requirements:**

**Input:**
- Format: Raw PCM, 16-bit, little-endian
- Sample rate: **16kHz**
- Channels: Mono (1)

**Output:**
- Format: Raw PCM, 16-bit, little-endian  
- Sample rate: **24kHz**
- Channels: Mono (1)

### **JavaScript/Node.js Example:**

```javascript
import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({});

const config = {
  responseModalities: [Modality.AUDIO],
  systemInstruction: "You are conducting an interview..."
};

const session = await ai.live.connect({
  model: 'gemini-2.5-flash-native-audio-preview-12-2025',
  config: config,
  callbacks: {
    onopen: () => console.log('Connected'),
    onmessage: (msg) => {
      // Handle audio response
      if (msg.serverContent?.modelTurn?.parts) {
        for (const part of msg.serverContent.modelTurn.parts) {
          if (part.inlineData?.data) {
            const audioBase64 = part.inlineData.data;
            // Play or send to Tavus
          }
        }
      }
    }
  }
});

// Send audio
session.send({ data: audioChunk, mimeType: 'audio/pcm' });
```

### **Key Configuration Options:**

```python
CONFIG = {
    "response_modalities": ["AUDIO"],           # or ["TEXT"] or ["AUDIO", "TEXT"]
    "system_instruction": "Your prompt here",
    "thinking_config": {
        "thinking_budget": 1024                 # 0 to disable thinking
    },
    "output_audio_transcription": {},           # Get text transcription of audio
    "speech_config": {
        "voice_config": {
            "prebuilt_voice_config": {
                "voice_name": "Puck"            # Or: Charon, Kore, Fenrir, Aoede, Leda, Orus, Zephyr
            }
        }
    }
}
```

### **Session Management:**

```python
# Start session
async with client.aio.live.connect(model=MODEL, config=CONFIG) as session:
    
    # Send text (if needed)
    await session.send("Start the interview")
    
    # Send audio continuously
    while recording:
        audio_chunk = get_mic_audio()
        await session.send(audio_chunk, end_of_turn=False)
    
    await session.send(end_of_turn=True)  # Signal end of user turn
    
    # Receive responses
    async for response in session.receive():
        handle_response(response)
```

### **Free Tier:**
- ✅ Available on **Gemini Developer API** (free tier)
- ✅ 1,500 requests/day free
- ✅ Preview model (but stable enough for development)

---

## 🔗 **INTEGRATING TAVUS + GEMINI**

### **Architecture Options:**

### **Option 1: Gemini → Tavus Echo Mode (Recommended)**

```
User speaks (WebRTC) 
  ↓
Frontend captures audio
  ↓
Backend → Gemini Live API (audio input)
  ↓
Gemini generates audio response
  ↓
Backend → Tavus (Echo Mode - send audio)
  ↓
Tavus animates avatar with Gemini's audio
  ↓
User sees avatar speaking (WebRTC)
```

**Implementation:**

```python
# 1. Create Tavus conversation with Echo Mode
tavus_response = requests.post(
    'https://tavusapi.com/v2/conversations',
    headers={'x-api-key': TAVUS_KEY},
    json={
        'replica_id': REPLICA_ID,
        'persona_id': PERSONA_ID_WITH_ECHO_MODE
    }
)

conversation_id = tavus_response.json()['conversation_id']
conversation_url = tavus_response.json()['conversation_url']

# 2. Connect to Gemini
async with gemini_client.aio.live.connect(model=MODEL, config=CONFIG) as gemini_session:
    
    # 3. User audio → Gemini
    async for user_audio_chunk in user_audio_stream:
        await gemini_session.send(user_audio_chunk)
    
    # 4. Gemini audio → Tavus
    async for response in gemini_session.receive():
        if response.server_content.model_turn:
            for part in response.server_content.model_turn.parts:
                if part.inline_data:
                    gemini_audio = part.inline_data.data
                    
                    # Send to Tavus
                    requests.post(
                        f'https://tavusapi.com/v2/conversations/{conversation_id}/speak',
                        headers={'x-api-key': TAVUS_KEY},
                        json={'audio': gemini_audio}
                    )
```

### **Option 2: Tavus with Custom LLM (Gemini)**

Configure Tavus persona to use Gemini as the LLM:

```json
{
  "persona_name": "Interviewer",
  "system_prompt": "Conduct interview...",
  "layers": {
    "llm": {
      "model": "gemini-2.5-flash-native-audio-preview-12-2025",
      "base_url": "https://generativelanguage.googleapis.com/v1beta",
      "api_key": "YOUR_GEMINI_API_KEY"
    }
  }
}
```

**BUT**: This might not work directly because:
- Gemini Live API uses WebSocket, not REST
- Tavus expects standard chat completion endpoints
- **Option 1 (Echo Mode) is more reliable**

---

## ⚡ **LATENCY BREAKDOWN**

### **Full Pipeline (Tavus + Gemini):**

```
User stops speaking
  ↓ 
VAD detection: 200ms
  ↓
Audio → Gemini: 50ms
  ↓
Gemini processing: 500-800ms
  ↓
Gemini → Tavus: 50ms
  ↓
Tavus avatar rendering: 300-500ms
  ↓
Video → User: 100ms

Total: 1.2 - 1.7 seconds
```

This is **excellent** for conversational AI!

---

## 💰 **COST ANALYSIS**

### **For a 25-minute interview:**

**Tavus:**
- First 25 mins: **FREE** (free tier)
- After: $0.37/min = ~$9.25 for 25 mins

**Gemini:**
- **FREE** (within daily limits)
- Even at scale: ~$0.02/minute

**Total for testing**: **FREE** for first 25 minutes!

---

## 🎯 **IMPLEMENTATION RECOMMENDATION**

Based on both docs, here's the **optimal setup** for your AI interviewer:

### **Simple Flow:**

1. **Frontend**: Capture user audio via WebRTC
2. **Backend**: 
   - Initialize Tavus conversation (Echo Mode)
   - Initialize Gemini Live session (with interview prompt)
   - Stream user audio → Gemini
   - Stream Gemini audio → Tavus
   - Tavus streams avatar video → Frontend

3. **System Prompt** (sent to Gemini):
```python
system_prompt = f"""
You are a professional interviewer conducting a {level} level interview.

Interview Topic: {user_skill_input}

{f"Candidate CV: {cv_summary}" if cv_uploaded else ""}

Instructions:
- Ask clear, relevant questions one at a time
- Be professional and encouraging  
- Adapt based on responses
- Duration: ~20-30 minutes
- Start with greeting and "tell me about yourself"
- End with "any questions for me?"

Keep responses natural and conversational for audio output.
"""
```

This gives you:
- ✅ **Free for testing** (25 mins Tavus + unlimited Gemini)
- ✅ **1-2 second latency** (excellent for conversation)
- ✅ **Simple architecture** (just audio pass-through)
- ✅ **Full customization** (Gemini handles all interview logic)
- ✅ **Realistic avatar** (Tavus Phoenix-3 rendering)

Would you like me to create a detailed implementation guide with actual code for this setup?

---

# 📋 COMPREHENSIVE IMPLEMENTATION PLAN

## 🎯 Project Overview

Build an **AI Interview System** that enables users to practice interviews with an AI-powered avatar. The system uses:
- **Gemini 2.5 Flash Live API** for real-time conversational AI with native audio processing
- **Tavus CVI (Conversational Video Interface)** for photorealistic avatar video rendering
- **Daily.co WebRTC** for real-time audio/video streaming to the frontend

---

## 🏗️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React.js / Next.js | User interface |
| **Backend** | Python FastAPI | API orchestration |
| **Real-time Audio** | Gemini Live API | Native audio I/O, conversation logic |
| **Avatar Rendering** | Tavus CVI + Echo Mode | Photorealistic video avatar |
| **Streaming** | Daily.co WebRTC (via Tavus) | Low-latency audio/video |
| **CV Parsing** | PyPDF2 / pdfplumber | Extract text from uploaded CVs |
| **Database** | PostgreSQL (existing) | Store interview sessions & transcripts |

---

## 📁 Project Structure

```
backend/
├── api/
│   ├── interview/
│   │   ├── __init__.py
│   │   ├── routes.py           # Interview API endpoints
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── services.py         # Business logic
│   │   └── websocket.py        # WebSocket handlers
│   └── ...
├── services/
│   ├── gemini_live.py          # Gemini Live API client
│   ├── tavus_client.py         # Tavus CVI client
│   └── cv_parser.py            # CV text extraction
├── config/
│   └── interview_config.py     # API keys & settings
└── ...

src/
├── pages/
│   └── AIInterview/
│       ├── index.jsx           # Main interview page
│       ├── SetupForm.jsx       # Pre-interview form
│       ├── InterviewRoom.jsx   # Live interview UI
│       └── ResultsPage.jsx     # Post-interview summary
├── components/
│   └── interview/
│       ├── AvatarVideo.jsx     # Tavus video embed
│       ├── AudioCapture.jsx    # Microphone handling
│       └── TranscriptPanel.jsx # Real-time transcript
└── ...
```

---

## 📝 IMPLEMENTATION TASKS

### PHASE 0: Environment Setup & Configuration

- [ ] **0.1** Create `.env` entries for API keys:
  ```env
  TAVUS_API_KEY=your_tavus_api_key
  GEMINI_API_KEY=your_gemini_api_key
  TAVUS_REPLICA_ID=default_replica_id
  ```

- [ ] **0.2** Install Python dependencies:
  ```bash
  pip install google-genai websockets aiohttp pdfplumber fastapi[all]
  ```

- [ ] **0.3** Install frontend dependencies:
  ```bash
  npm install @daily-co/daily-js
  ```

- [ ] **0.4** Create configuration module `backend/config/interview_config.py`:
  ```python
  import os
  from pydantic_settings import BaseSettings

  class InterviewConfig(BaseSettings):
      tavus_api_key: str = os.getenv("TAVUS_API_KEY", "")
      gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
      tavus_replica_id: str = os.getenv("TAVUS_REPLICA_ID", "")
      tavus_base_url: str = "https://tavusapi.com/v2"
      
      class Config:
          env_file = ".env"
  ```

---

### PHASE 1: Backend - Tavus Integration

- [ ] **1.1** Create `backend/services/tavus_client.py`:
  - [ ] Implement `TavusClient` class with async HTTP client
  - [ ] Method: `create_persona(name, system_prompt)` → Creates persona for interviews
  - [ ] Method: `create_conversation(replica_id, persona_id)` → Starts Tavus session
  - [ ] Method: `send_audio(conversation_id, audio_base64)` → Echo Mode audio
  - [ ] Method: `end_conversation(conversation_id)` → Cleanup

- [ ] **1.2** Implement Tavus Persona Creation:
  ```python
  async def create_persona(self, name: str, system_prompt: str) -> dict:
      response = await self.client.post(
          f"{self.base_url}/personas",
          headers={"x-api-key": self.api_key},
          json={
              "persona_name": name,
              "system_prompt": system_prompt,
              "layers": {
                  "transport": {"microphone": False}  # Echo mode
              }
          }
      )
      return response.json()
  ```

- [ ] **1.3** Implement Tavus Conversation Creation:
  ```python
  async def create_conversation(self, replica_id: str, persona_id: str) -> dict:
      response = await self.client.post(
          f"{self.base_url}/conversations",
          headers={"x-api-key": self.api_key},
          json={
              "replica_id": replica_id,
              "persona_id": persona_id,
              "conversation_name": f"Interview_{uuid.uuid4()}"
          }
      )
      return response.json()  # Contains conversation_url for embedding
  ```

- [ ] **1.4** Implement Echo Mode audio sending:
  ```python
  async def send_audio(self, conversation_id: str, audio_base64: str) -> dict:
      response = await self.client.post(
          f"{self.base_url}/conversations/{conversation_id}/speak",
          headers={"x-api-key": self.api_key},
          json={"audio": audio_base64}
      )
      return response.json()
  ```

---

### PHASE 2: Backend - Gemini Live API Integration

- [ ] **2.1** Create `backend/services/gemini_live.py`:
  - [ ] Implement `GeminiLiveClient` class
  - [ ] Method: `connect(system_prompt)` → Establish WebSocket session
  - [ ] Method: `send_audio(audio_bytes)` → Stream user audio
  - [ ] Method: `receive_audio()` → Get LLM audio response
  - [ ] Method: `disconnect()` → Close session

- [ ] **2.2** Implement Gemini Live WebSocket Connection:
  ```python
  from google import genai

  class GeminiLiveClient:
      MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"
      
      def __init__(self, api_key: str):
          self.client = genai.Client(api_key=api_key)
          self.session = None
      
      async def connect(self, system_prompt: str):
          config = {
              "response_modalities": ["AUDIO"],
              "system_instruction": system_prompt,
              "speech_config": {
                  "voice_config": {
                      "prebuilt_voice_config": {"voice_name": "Puck"}
                  }
              }
          }
          self.session = await self.client.aio.live.connect(
              model=self.MODEL, config=config
          )
          return self.session
  ```

- [ ] **2.3** Implement audio streaming methods:
  ```python
  async def send_audio(self, audio_chunk: bytes, end_of_turn: bool = False):
      await self.session.send(
          {"data": audio_chunk, "mime_type": "audio/pcm"},
          end_of_turn=end_of_turn
      )
  
  async def receive_audio(self):
      async for response in self.session.receive():
          if response.server_content and response.server_content.model_turn:
              for part in response.server_content.model_turn.parts:
                  if part.inline_data:
                      yield part.inline_data.data  # base64 audio
  ```

- [ ] **2.4** Handle conversation context and interview flow:
  - [ ] Build interview system prompt template
  - [ ] Include skill topic, level, and CV context
  - [ ] Handle interview ending detection

---

### PHASE 3: Backend - CV Parser Service

- [ ] **3.1** Create `backend/services/cv_parser.py`:
  - [ ] Implement PDF text extraction with `pdfplumber`
  - [ ] Support DOCX files with `python-docx`
  - [ ] Return cleaned text summary (limit to 2000 chars)

  ```python
  import pdfplumber
  from docx import Document
  
  class CVParser:
      MAX_CHARS = 2000
      
      def parse(self, file_bytes: bytes, filename: str) -> str:
          if filename.endswith('.pdf'):
              return self._parse_pdf(file_bytes)
          elif filename.endswith('.docx'):
              return self._parse_docx(file_bytes)
          return ""
      
      def _parse_pdf(self, file_bytes: bytes) -> str:
          with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
              text = "\n".join(page.extract_text() or "" for page in pdf.pages)
          return text[:self.MAX_CHARS]
      
      def _parse_docx(self, file_bytes: bytes) -> str:
          doc = Document(io.BytesIO(file_bytes))
          text = "\n".join(para.text for para in doc.paragraphs if para.text)
          return text[:self.MAX_CHARS]
  ```

- [ ] **3.3** Create System Prompt Builder with CV Integration:
  ```python
  # backend/services/prompt_builder.py
  
  def build_interview_prompt(skill_topic: str, level: str, cv_text: str = "") -> str:
      """
      Builds the system prompt for Gemini with CV context.
      The AI will use CV details to ask personalized questions.
      """
      
      cv_section = ""
      if cv_text:
          cv_section = f"""
  CANDIDATE'S CV/RESUME:
  ----------------------
  {cv_text}
  ----------------------
  
  CV-BASED INTERVIEW INSTRUCTIONS:
  - Reference specific projects, skills, or experience from the CV naturally
  - If CV mentions "{skill_topic}" experience, ask follow-up questions about those projects
  - Use the candidate's name from the CV when addressing them
  - Ask about career transitions or gaps visible in their work history
  - Probe deeper into technologies/tools mentioned in the CV
  - Connect CV experience to the interview topic wherever relevant
  """
      else:
          cv_section = """
  NO CV PROVIDED:
  - Focus on general questions about the interview topic
  - Assess fundamentals and theoretical knowledge
  - Ask about hypothetical scenarios and problem-solving
  - Learn about their background through the conversation itself
  """
      
      return f"""
  You are a professional interviewer conducting a {level.upper()} level interview.
  
  INTERVIEW TOPIC: {skill_topic}
  
  {cv_section}
  
  INTERVIEW GUIDELINES:
  1. Start with a warm greeting and ask "Tell me about yourself"
  2. Ask clear, relevant questions ONE AT A TIME
  3. Wait for the candidate to finish before asking the next question
  4. Be professional, encouraging, and supportive
  5. Adapt difficulty based on their responses
  6. For {level} level:
     - Beginner: Focus on fundamentals, basic concepts, simple scenarios
     - Intermediate: Include practical experience, design decisions, trade-offs
     - Advanced: Deep technical discussions, architecture, edge cases, optimization
  7. Duration: approximately 20-30 minutes (8-12 questions)
  8. End with "Do you have any questions for me?"
  
  RESPONSE STYLE:
  - Keep responses conversational and natural for audio output
  - Use short, clear sentences
  - Avoid technical jargon when explaining
  - Be encouraging even when probing deeply
  
  Begin the interview now with your greeting.
  """
  ```

- [ ] **3.4** Example: How CV Affects Interview Questions:
  
  **Sample CV Input:**
  ```
  Rahul Sharma | Backend Developer
  Experience: 
  - TechStart Inc (2023-2025): Built REST APIs using Django
  - Freelance (2022-2023): Python automation scripts
  Skills: Python, Django, FastAPI, PostgreSQL, Docker
  Projects: E-commerce API, Real-time Chat Backend
  ```
  
  **Gemini's Personalized Questions:**
  | # | Question | CV Reference |
  |---|----------|--------------|
  | 1 | "Hi Rahul! Tell me about your backend journey." | Uses name |
  | 2 | "I see you built an E-commerce API. What was the most challenging part?" | References project |
  | 3 | "You've used both Django and FastAPI. How do you decide which to use?" | Compares CV skills |
  | 4 | "Tell me about handling PostgreSQL at scale for your e-commerce project." | Connects tech + project |
  | 5 | "I notice you transitioned from freelancing to full-time. What drove that?" | Career transition |

---



### PHASE 4: Backend - Interview API Endpoints

- [ ] **4.1** Create `backend/api/interview/schemas.py`:
  ```python
  from pydantic import BaseModel
  from typing import Optional
  from enum import Enum
  
  class InterviewLevel(str, Enum):
      BEGINNER = "beginner"
      INTERMEDIATE = "intermediate"
      ADVANCED = "advanced"
  
  class StartInterviewRequest(BaseModel):
      skill_topic: str
      level: InterviewLevel = InterviewLevel.INTERMEDIATE
  
  class StartInterviewResponse(BaseModel):
      session_id: str
      conversation_url: str  # Tavus Daily.co room URL
      status: str
  
  class InterviewSummaryResponse(BaseModel):
      session_id: str
      duration_seconds: int
      performance_summary: str
      strengths: list[str]
      improvements: list[str]
  ```

- [ ] **4.2** Create `backend/api/interview/routes.py`:
  - [ ] `POST /api/interview/start` - Initialize interview session
  - [ ] `POST /api/interview/{session_id}/upload-cv` - Upload CV (optional)
  - [ ] `WebSocket /api/interview/{session_id}/stream` - Real-time audio
  - [ ] `POST /api/interview/{session_id}/end` - End interview & get summary
  - [ ] `GET /api/interview/{session_id}/transcript` - Get full transcript

- [ ] **4.3** Implement Start Interview Endpoint:
  ```python
  @router.post("/start", response_model=StartInterviewResponse)
  async def start_interview(
      request: StartInterviewRequest,
      cv_file: Optional[UploadFile] = File(None)
  ):
      session_id = str(uuid.uuid4())
      
      # Parse CV if provided
      cv_text = ""
      if cv_file:
          cv_bytes = await cv_file.read()
          cv_text = cv_parser.parse(cv_bytes, cv_file.filename)
      
      # Build system prompt
      system_prompt = build_interview_prompt(
          skill_topic=request.skill_topic,
          level=request.level,
          cv_text=cv_text
      )
      
      # Create Tavus persona & conversation
      persona = await tavus_client.create_persona(
          f"Interviewer_{session_id}", system_prompt
      )
      conversation = await tavus_client.create_conversation(
          config.tavus_replica_id, persona["persona_id"]
      )
      
      # Initialize Gemini session
      gemini_session = await gemini_client.connect(system_prompt)
      
      # Store session data
      sessions[session_id] = {
          "conversation_id": conversation["conversation_id"],
          "gemini_session": gemini_session,
          "skill_topic": request.skill_topic,
          "level": request.level,
          "started_at": datetime.now()
      }
      
      return StartInterviewResponse(
          session_id=session_id,
          conversation_url=conversation["conversation_url"],
          status="ready"
      )
  ```

- [ ] **4.4** Implement WebSocket Audio Stream Handler:
  ```python
  @router.websocket("/stream/{session_id}")
  async def interview_stream(websocket: WebSocket, session_id: str):
      await websocket.accept()
      session = sessions.get(session_id)
      
      try:
          while True:
              # Receive user audio
              user_audio = await websocket.receive_bytes()
              
              # Send to Gemini
              await session["gemini_session"].send_audio(user_audio, end_of_turn=True)
              
              # Get Gemini's response
              async for gemini_audio in session["gemini_session"].receive_audio():
                  # Send to Tavus for avatar rendering
                  await tavus_client.send_audio(
                      session["conversation_id"],
                      base64.b64encode(gemini_audio).decode()
                  )
                  
                  # Notify frontend
                  await websocket.send_json({"type": "response_playing"})
                  
      except WebSocketDisconnect:
          await cleanup_session(session_id)
  ```

- [ ] **4.5** Implement End Interview & Summary Generation:
  ```python
  @router.post("/{session_id}/end")
  async def end_interview(session_id: str):
      session = sessions.get(session_id)
      
      # Close Tavus conversation
      await tavus_client.end_conversation(session["conversation_id"])
      
      # Generate summary using Gemini
      summary_prompt = f"""
      Based on the interview about {session['skill_topic']}:
      Level: {session['level']}
      
      Provide a structured evaluation:
      1. Overall performance assessment
      2. Key strengths demonstrated  
      3. Areas for improvement
      4. Recommendation
      
      Be encouraging and constructive.
      """
      
      summary = await gemini_client.generate_text(summary_prompt)
      
      # Cleanup
      del sessions[session_id]
      
      return {"status": "completed", "summary": summary}
  ```

---

### PHASE 5: Frontend - Interview Setup Page

- [ ] **5.1** Create `src/pages/AIInterview/index.jsx`:
  - [ ] Route setup for `/ai-interview`
  - [ ] State management with useState/useReducer
  - [ ] Navigate between Setup → Interview → Results

- [ ] **5.2** Create `src/pages/AIInterview/SetupForm.jsx`:
  ```jsx
  const SetupForm = ({ onStart }) => {
    const [skillTopic, setSkillTopic] = useState('');
    const [level, setLevel] = useState('intermediate');
    const [cvFile, setCvFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      const formData = new FormData();
      formData.append('skill_topic', skillTopic);
      formData.append('level', level);
      if (cvFile) formData.append('cv_file', cvFile);
      
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      onStart(data);  // Pass session info to parent
    };

    return (
      <form onSubmit={handleSubmit}>
        <input 
          placeholder="What skill/topic for interview?"
          value={skillTopic}
          onChange={(e) => setSkillTopic(e.target.value)}
          required
        />
        
        <input 
          type="file" 
          accept=".pdf,.docx"
          onChange={(e) => setCvFile(e.target.files[0])}
        />
        
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        
        <button type="submit" disabled={loading || !skillTopic}>
          {loading ? 'Preparing...' : 'Start Interview'}
        </button>
      </form>
    );
  };
  ```

- [ ] **5.3** Style the setup form with Neo-Brutalist theme (consistent with SkillMeterAI)

---

### PHASE 6: Frontend - Live Interview Room

- [ ] **6.1** Create `src/pages/AIInterview/InterviewRoom.jsx`:
  - [ ] Embed Tavus video using Daily.co iframe/SDK
  - [ ] Audio capture from user microphone
  - [ ] WebSocket connection to backend
  - [ ] Real-time transcript display

- [ ] **6.2** Implement Daily.co Iframe Embedding:
  ```jsx
  import DailyIframe from '@daily-co/daily-js';

  const InterviewRoom = ({ sessionId, conversationUrl }) => {
    const videoRef = useRef(null);
    const wsRef = useRef(null);
    
    useEffect(() => {
      // Embed Tavus/Daily video
      const callFrame = DailyIframe.createFrame(videoRef.current, {
        iframeStyle: { width: '100%', height: '100%' }
      });
      
      callFrame.join({ url: conversationUrl });
      
      // Setup WebSocket for audio streaming
      wsRef.current = new WebSocket(
        `ws://localhost:8000/api/interview/stream/${sessionId}`
      );
      
      return () => {
        callFrame.destroy();
        wsRef.current?.close();
      };
    }, [sessionId, conversationUrl]);

    return (
      <div className="interview-room">
        <div ref={videoRef} className="avatar-video" />
        <AudioCapture wsRef={wsRef} />
        <button onClick={handleEndInterview}>End Interview</button>
      </div>
    );
  };
  ```

- [ ] **6.3** Create `src/components/interview/AudioCapture.jsx`:
  - [ ] Request microphone permission
  - [ ] Capture audio using MediaRecorder API
  - [ ] Send PCM audio chunks via WebSocket
  - [ ] Handle Voice Activity Detection (VAD)

- [ ] **6.4** Implement Audio Capture:
  ```jsx
  const AudioCapture = ({ wsRef }) => {
    const [isRecording, setIsRecording] = useState(true);
    
    useEffect(() => {
      let mediaRecorder;
      
      const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            sampleRate: 16000, 
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true 
          } 
        });
        
        mediaRecorder = new MediaRecorder(stream, { 
          mimeType: 'audio/webm;codecs=opus' 
        });
        
        mediaRecorder.ondataavailable = (e) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            e.data.arrayBuffer().then(buffer => {
              wsRef.current.send(buffer);
            });
          }
        };
        
        mediaRecorder.start(250); // Send chunks every 250ms
      };
      
      if (isRecording) startRecording();
      
      return () => mediaRecorder?.stop();
    }, [isRecording, wsRef]);

    return (
      <div className="mic-indicator">
        {isRecording ? '🎤 Listening...' : '🔇 Muted'}
      </div>
    );
  };
  ```

- [ ] **6.5** Add real-time transcript panel (optional but recommended)

---

### PHASE 7: Frontend - Results Page

- [ ] **7.1** Create `src/pages/AIInterview/ResultsPage.jsx`:
  - [ ] Display interview summary
  - [ ] Show strengths and areas for improvement
  - [ ] Download transcript option
  - [ ] Start new interview button

- [ ] **7.2** Implement Results Display:
  ```jsx
  const ResultsPage = ({ summary, sessionId }) => {
    return (
      <div className="results-page">
        <h1>Interview Complete! ✓</h1>
        
        <div className="summary-card">
          <h2>Performance Summary</h2>
          <p>{summary.performance_summary}</p>
          
          <h3>Strengths</h3>
          <ul>
            {summary.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          
          <h3>Areas for Improvement</h3>
          <ul>
            {summary.improvements.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
        
        <div className="actions">
          <button onClick={() => downloadTranscript(sessionId)}>
            Download Transcript
          </button>
          <button onClick={() => window.location.reload()}>
            Start New Interview
          </button>
        </div>
      </div>
    );
  };
  ```

---

### PHASE 8: Database Integration

- [ ] **8.1** Create database models in `backend/api/models.py`:
  ```python
  class InterviewSession(models.Model):
      id = models.UUIDField(primary_key=True, default=uuid.uuid4)
      user = models.ForeignKey(User, on_delete=models.CASCADE)
      skill_topic = models.CharField(max_length=255)
      level = models.CharField(max_length=20)
      cv_text = models.TextField(blank=True)
      started_at = models.DateTimeField(auto_now_add=True)
      ended_at = models.DateTimeField(null=True)
      duration_seconds = models.IntegerField(null=True)
      transcript = models.JSONField(default=list)
      summary = models.JSONField(default=dict)
      
  class Meta:
      db_table = "interview_sessions"
  ```

- [ ] **8.2** Create database migrations:
  ```bash
  python manage.py makemigrations
  python manage.py migrate
  ```

- [ ] **8.3** Update interview endpoints to persist session data

---

### PHASE 9: Testing & Quality Assurance

- [ ] **9.1** Create unit tests for services:
  - [ ] Test `TavusClient` with mocked HTTP responses
  - [ ] Test `GeminiLiveClient` with mocked WebSocket
  - [ ] Test `CVParser` with sample PDF/DOCX files

- [ ] **9.2** Create integration tests:
  - [ ] Test full interview flow: start → stream → end
  - [ ] Test error handling (API failures, timeouts)

- [ ] **9.3** Manual testing checklist:
  - [ ] Start interview with skill topic only
  - [ ] Start interview with CV upload
  - [ ] Test all three interview levels
  - [ ] Test microphone permissions
  - [ ] Test interview ending and summary generation
  - [ ] Test on Chrome, Firefox, Safari

---

### PHASE 10: Production Readiness

- [ ] **10.1** Implement rate limiting for API endpoints
- [ ] **10.2** Add error handling and retry logic for external APIs
- [ ] **10.3** Configure CORS for production domain
- [ ] **10.4** Add monitoring and logging (Sentry, structured logs)
- [ ] **10.5** Document API endpoints with OpenAPI/Swagger
- [ ] **10.6** Create user documentation/help section

---

## 🔑 API Keys Required

| Service | Sign Up URL | Free Tier |
|---------|-------------|-----------|
| **Tavus** | https://platform.tavus.io | 25 mins/month |
| **Google Gemini** | https://aistudio.google.com | 1500 req/day |
| **Daily.co** | (via Tavus) | Included |

---

## ⚡ Quick Start Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py runserver

# Frontend  
cd src
npm install
npm run dev
```

---

## 📊 Estimated Development Timeline

| Phase | Duration | Complexity |
|-------|----------|------------|
| Phase 0: Setup | 1-2 hours | Low |
| Phase 1: Tavus | 3-4 hours | Medium |
| Phase 2: Gemini | 4-5 hours | High |
| Phase 3: CV Parser | 1-2 hours | Low |
| Phase 4: API Endpoints | 4-6 hours | Medium |
| Phase 5: Setup UI | 2-3 hours | Low |
| Phase 6: Interview Room | 6-8 hours | High |
| Phase 7: Results | 2-3 hours | Low |
| Phase 8: Database | 2-3 hours | Medium |
| Phase 9: Testing | 4-6 hours | Medium |
| Phase 10: Production | 3-4 hours | Medium |

**Total Estimated: 32-46 hours** (1-2 weeks part-time)

---

## 🚀 Next Steps

1. **Sign up for Tavus API** at https://platform.tavus.io
2. **Get Gemini API key** at https://aistudio.google.com  
3. **Start with Phase 0** - Environment setup
4. **Implement phases sequentially** - Each phase builds on the previous

---

> **Note**: Mark tasks as `[x]` when completed to track progress. For example:
> - [x] **0.1** Create `.env` entries for API keys ✅




