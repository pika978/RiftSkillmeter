# SkillMeter AI
## Product Requirements Document

**Version:** 1.0  
**Date:** January 2026  
**Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Core Features & Functionality](#3-core-features--functionality)
4. [Advanced Features](#4-advanced-features)
5. [Notification & Engagement System](#5-notification--engagement-system)
6. [Certification & Verification](#6-certification--verification)
7. [Technical Architecture](#7-technical-architecture)
8. [User Experience & Interface](#8-user-experience--interface)
9. [Success Metrics & KPIs](#9-success-metrics--kpis)
10. [Future Development Roadmap](#10-future-development-roadmap)
11. [Risks & Mitigation Strategies](#11-risks--mitigation-strategies)
12. [Appendix](#12-appendix)

---

## 1. Executive Summary

### 1.1 Product Vision

**SkillMeter AI** is a comprehensive, AI-powered personalized learning platform that transforms unstructured free online educational content into a structured, goal-oriented, and assessment-driven learning experience.

**Vision Statement:**  
To democratize personalized education by converting free online resources into structured, assessed, and trackable learning experiences that rival traditional paid platforms.

### 1.2 Problem Statement

The internet offers abundant free educational content, but learners face several critical challenges:

- **Information Overload**: Difficulty finding relevant, quality content among millions of resources
- **Lack of Structure**: No clear learning paths or progressive difficulty levels
- **No Assessment**: Absence of mechanisms to verify actual understanding and retention
- **Consistency Issues**: Difficulty maintaining motivation and learning discipline
- **Missing Personalization**: One-size-fits-all approaches that ignore individual skill levels and goals

### 1.3 Solution Overview

SkillMeter AI addresses these challenges through an intelligent learning platform that:

- Discovers and curates high-quality free content from YouTube and other sources
- Generates personalized learning roadmaps using Google Gemini AI
- Creates AI-generated study notes and assessments for each concept
- Provides real-time focus monitoring and coding practice environments
- Connects learners with industry mentors for guidance
- Tracks progress and issues verified certificates upon completion

### 1.4 Key Value Propositions

| Stakeholder | Value Delivered |
|-------------|-----------------|
| **Students** | Structured learning paths from free content with real assessments |
| **Career Switchers** | Guided upskilling with mentor support and verifiable credentials |
| **Self-Learners** | Personalized roadmaps with progress tracking and gamification |
| **Mentors** | Platform to monetize expertise with built-in booking and payment |
| **Employers** | Verifiable learning outcomes through QR-authenticated certificates |

---

## 2. Product Overview

### 2.1 Product Type & Architecture

**Full-stack web application** with the following technical stack:

**Frontend:**
- React 18.3.1 with Vite 5.4.19 build system
- TailwindCSS 3.4.17 with shadcn/ui components (55+ components)
- TanStack Query 5.83.0 for server state management
- React Router DOM 6.30.1 for routing
- Framer Motion 12.26.2 for animations

**Backend:**
- Django 5.2.10 with Django REST Framework
- Django Channels + Daphne for WebSocket support
- JWT authentication (SimpleJWT)
- SQLite3 (development) / PostgreSQL-ready architecture

**Design Philosophy:**
- Neo-Brutalist aesthetic with high contrast
- Mobile-first responsive design
- Accessibility-compliant (WCAG 2.1 AA)

### 2.2 Target Audience

| User Type | Demographics | Needs | Goals |
|-----------|-------------|-------|-------|
| **Students** | 18-25, College/University | Supplement formal education | Master new technologies, prepare for careers |
| **Career Switchers** | 25-40, Professionals | Transition to tech roles | Learn in-demand skills, get certified |
| **Self-Learners** | 18-50, Diverse backgrounds | Personal development | Acquire new skills, stay competitive |
| **Developers** | 22-45, Software engineers | Learn new frameworks | Upskill, advance careers |
| **Mentors** | 28-60, Industry experts | Monetize expertise | Share knowledge, earn income |

### 2.3 Key Differentiators

SkillMeter AI stands apart from competitors through:

1. **AI-First Approach**: Google Gemini AI powers roadmap generation, content curation, and assessment creation
2. **Focus Monitoring**: MediaPipe-powered real-time attention tracking during study sessions
3. **Code Playground**: Built-in Monaco editor with 12+ language support and live execution
4. **Mock Interviews**: AI interviewer with WebSocket-based real-time interaction
5. **Mentor Marketplace**: Integrated platform connecting learners with industry experts
6. **Verifiable Certificates**: QR code-authenticated PDFs with public verification

---

## 3. Core Features & Functionality

### 3.1 User Onboarding & Profiling

#### 3.1.1 Registration & Authentication

**Authentication System:**
- JWT-based with dual-token approach
  - Access tokens: 60-minute validity
  - Refresh tokens: 7-day validity
- Automatic token rotation on frontend
- Secure password hashing (Django defaults)
- Email and username-based login

**User Flow:**
1. User signs up with email, username, password
2. Email verification sent (optional)
3. User completes onboarding questionnaire
4. Profile created with learning preferences

#### 3.1.2 Learner Profile Creation

**Collected Information:**
- **Skill Level**: Beginner, Intermediate, Advanced
- **Learning Goals**: JSON array of objectives (e.g., "Learn React", "Prepare for interviews")
- **Daily Study Time**: Available minutes per day (15, 30, 60, 90, 120+)
- **Phone Number**: For WhatsApp notifications
- **Preferred Topics**: Areas of interest for personalized recommendations

**Database Model: `LearnerProfile`**
```python
{
  "user": ForeignKey(User),
  "skill_level": CharField(choices=["beginner", "intermediate", "advanced"]),
  "learning_goals": JSONField(),
  "daily_study_time": IntegerField(),  # minutes
  "phone_number": CharField(),
  "onboarding_completed": BooleanField()
}
```

### 3.2 AI-Powered Learning Roadmaps

#### 3.2.1 Content Discovery

**YouTube Integration:**
- **API**: YouTube Data API v3
- **Search Strategy**:
  - Query construction based on topic + skill level
  - Filter by relevance, upload date, duration
  - Quality scoring based on views, likes, comments
  - Quota management with fallback to direct URLs

**Discovery Process:**
1. User selects topic (e.g., "React for Beginners")
2. System queries YouTube API with skill-adjusted terms
3. Results filtered and ranked by quality metrics
4. Top videos selected for course structure
5. Fallback: If quota exceeded, direct YouTube search URL provided

#### 3.2.2 Roadmap Generation

**AI Service: Google Gemini 3 Flash**

**Generation Process:**
1. **Input**: Topic, skill level, daily study time, learning goals
2. **AI Prompt Engineering**:
   ```
   Generate a complete learning roadmap for [TOPIC] at [SKILL_LEVEL].
   Structure: Course → Chapters → Concepts
   Include: estimated durations, prerequisites, key takeaways
   Align with: [DAILY_STUDY_TIME] minutes/day, goals: [LEARNING_GOALS]
   ```
3. **Output Processing**:
   - Parse AI response into structured JSON
   - Create Course, Chapter, Concept database records
   - Link YouTube videos to each concept
   - Generate daily task schedule

**Database Structure:**
```
Course (title, description, difficulty, estimated_hours)
  └─ Chapter (title, order, description)
      └─ Concept (title, duration, video_url, notes, order)
```

**Example Roadmap:**
```
Course: "React Fundamentals"
├─ Chapter 1: "Introduction to React"
│   ├─ Concept 1: "What is React?" (15 min)
│   ├─ Concept 2: "Setting up environment" (30 min)
│   └─ Concept 3: "First React component" (45 min)
├─ Chapter 2: "Components & Props"
│   ├─ Concept 4: "Function components" (30 min)
│   └─ Concept 5: "Props and state" (60 min)
...
```

### 3.3 Learning Experience

#### 3.3.1 Video-Based Learning

**Video Player Features:**
- Embedded YouTube player with playback controls
- Progress markers showing completion status
- Next/Previous concept navigation
- Transcript display (when available)
- Speed control, quality selection
- Watch time tracking

**User Interface:**
```
┌─────────────────────────────────────────┐
│  [Video Player - YouTube Embed]         │
│  Progress: 45% | Time: 12:34 / 28:00    │
└─────────────────────────────────────────┘
[← Previous] [Mark Complete] [Next →]
```

#### 3.3.2 AI-Generated Study Notes

**Notes Generation Service:**
- **Input**: Video title, transcript (if available), topic context
- **AI Model**: Google Gemini 3 Flash
- **Prompt Strategy**:
  ```
  Create concise study notes for this video on [TOPIC]:
  - Key concepts and definitions
  - Important takeaways
  - Code examples (if applicable)
  - Summary in bullet points
  Format: Markdown
  ```

**Output Format:**
- Markdown with headers, lists, code blocks
- Rendered with `react-markdown`
- Syntax highlighting for code snippets
- Copy-to-clipboard functionality

**Example Notes:**
```markdown
# Understanding React Hooks

## Key Concepts
- Hooks are functions that let you use state and lifecycle features
- `useState` manages component state
- `useEffect` handles side effects

## Important Takeaways
- Hooks must be called at the top level
- Only call hooks from React functions
- Custom hooks enable reusable logic

## Code Example
```javascript
const [count, setCount] = useState(0);
```
```

#### 3.3.3 Assessments & Quizzes

**Quiz Generation:**
- **Trigger**: After concept completion
- **AI Service**: Google Gemini 3 Flash
- **Input**: Video notes, concept title, difficulty level
- **Output**: 5-10 MCQ questions with explanations

**Question Format:**
```json
{
  "question": "What is the purpose of useEffect hook?",
  "options": [
    "To manage component state",
    "To handle side effects",
    "To create custom hooks",
    "To optimize performance"
  ],
  "correctAnswer": 1,
  "explanation": "useEffect is specifically designed for handling side effects like data fetching, subscriptions, and manual DOM manipulation."
}
```

**Assessment Flow:**
1. User completes video watching
2. Clicks "Take Assessment"
3. AI generates quiz in real-time
4. User answers questions
5. Instant evaluation with score and explanations
6. Results saved to `AssessmentResult` model

**Scoring:**
- Score = (Correct Answers / Total Questions) × 100
- Pass threshold: 70%
- Failed assessments can be retaken
- Progress tracked in `UserProgress` model

### 3.4 Daily Learning Management

#### 3.4.1 Task Scheduling

**Automatic Task Generation:**
- **Trigger**: When user starts a roadmap
- **Algorithm**:
  1. Calculate total course duration
  2. Divide by user's daily study time
  3. Generate day-wise task list
  4. Assign concepts to specific dates

**Task Types:**
- **Video**: "Watch video on [Topic]"
- **Notes**: "Review notes for [Concept]"
- **Assessment**: "Complete quiz for [Concept]"

**Database Model: `DailyTask`**
```python
{
  "user": ForeignKey(User),
  "concept": ForeignKey(Concept),
  "task_type": CharField(choices=["video", "notes", "assessment"]),
  "title": CharField(),
  "scheduled_date": DateField(),
  "completed": BooleanField(),
  "completed_at": DateTimeField()
}
```

**Example Schedule:**
```
Day 1:
- Watch "Introduction to React" (15 min)
- Review notes for "Introduction to React"
- Take quiz on "Introduction to React"

Day 2:
- Watch "Setting up React environment" (30 min)
- Practice: Create first React app

Day 3:
- Watch "React components" (45 min)
- Assessment: React basics quiz
```

#### 3.4.2 Streak Tracking & Gamification

**Streak System:**
- **Current Streak**: Consecutive days with completed tasks
- **Longest Streak**: Personal best record
- **Streak Resets**: If a day is missed (no completed tasks)
- **Grace Period**: 24-hour window for late completions

**Gamification Elements:**
- 🔥 Fire emoji for active streaks
- 📊 GitHub-style contribution graph
- 🏆 Badges for milestones (7-day, 30-day, 90-day streaks)
- 📈 Level-up system based on concepts completed

**Contribution Graph:**
```
Activity Overview
Jan  Feb  Mar  Apr
░░░░░░██░░░░░░░░░░░░
░░░░██░░░░██░░░░░░░░
░░░░░░░░░░░░██░░░░░░

■ Dark = More activity
□ Light = Less activity
```

**Database Model: `UserProgress`**
```python
{
  "user": OneToOne(User),
  "total_minutes_learned": IntegerField(),
  "total_concepts_completed": IntegerField(),
  "total_assessments_taken": IntegerField(),
  "average_score": FloatField(),
  "current_streak": IntegerField(),
  "longest_streak": IntegerField(),
  "last_activity_date": DateField()
}
```

---

## 4. Advanced Features

### 4.1 AI Study Room (Focus Monitoring)

#### 4.1.1 Technology Stack

**Computer Vision:**
- **MediaPipe Face Mesh**: 468-point facial landmark detection
- **Camera Utils**: Webcam stream management
- **WebGL**: Real-time canvas rendering for visual feedback

**Processing Pipeline:**
1. Camera captures 30 FPS video stream
2. MediaPipe detects 468 facial landmarks
3. Key points identified: nose tip, eyes, ears
4. Head pose calculated from landmark positions
5. Direction classified: Forward, Left, Right, Up, Down
6. Distraction detection logic applied

#### 4.1.2 Head Pose Calculation

**Algorithm:**
```javascript
function calculateHeadPose(landmarks) {
  const noseTip = landmarks[1];  // Nose tip landmark
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  
  // Calculate horizontal angle
  const eyeMidpoint = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2
  };
  
  const horizontalAngle = Math.atan2(
    noseTip.x - eyeMidpoint.x,
    noseTip.z
  ) * (180 / Math.PI);
  
  // Calculate vertical angle
  const verticalAngle = Math.atan2(
    noseTip.y - eyeMidpoint.y,
    noseTip.z
  ) * (180 / Math.PI);
  
  return classifyDirection(horizontalAngle, verticalAngle);
}

function classifyDirection(hAngle, vAngle) {
  if (vAngle > 15) return "Down";  // Allowed - note-taking
  if (vAngle < -15) return "Up";   // Distraction
  if (hAngle > 20) return "Right"; // Distraction
  if (hAngle < -20) return "Left"; // Distraction
  return "Forward";                 // Focused
}
```

#### 4.1.3 Distraction Detection & Alerts

**Distraction Logic:**
- **Focused States**: Forward, Down (note-taking allowed)
- **Distracted States**: Left, Right, Up
- **Threshold**: 3 consecutive frames in distracted state
- **Cooldown**: 5 seconds between distraction alerts

**Alert System:**
- **Audio**: 4-beep tone (Web Audio API)
- **Visual**: Red border flash on video feed
- **Counter**: Distraction count incremented

**Metrics Tracked:**
```javascript
{
  sessionId: uuid,
  startTime: timestamp,
  endTime: timestamp,
  totalDuration: seconds,
  focusDuration: seconds,
  distractionCount: integer,
  focusPercentage: (focusDuration / totalDuration) * 100,
  distractionBreakdown: {
    left: count,
    right: count,
    up: count
  }
}
```

#### 4.1.4 Session Analytics

**Dashboard Metrics:**
- Total study time (all sessions)
- Average focus percentage
- Distraction trends over time
- Best focus session record
- Improvement suggestions

**Database Model: `StudySession`**
```python
{
  "user": ForeignKey(User),
  "started_at": DateTimeField(),
  "ended_at": DateTimeField(),
  "total_duration": IntegerField(),  # seconds
  "focus_duration": IntegerField(),  # seconds
  "distraction_count": IntegerField(),
  "focus_percentage": FloatField()
}
```

### 4.2 Practice Lab (Code Playground)

#### 4.2.1 Monaco Editor Integration

**Editor Features:**
- **Core Engine**: Monaco Editor 0.55.1 (VS Code engine)
- **Language Support**: 12+ languages with full IntelliSense
- **Themes**: Dark (default), Light, High Contrast
- **Features**:
  - Syntax highlighting
  - Auto-completion
  - Error detection
  - Code formatting
  - Multi-cursor editing
  - Find & replace
  - Minimap

**Editor Configuration:**
```javascript
{
  language: selectedLanguage,
  theme: "vs-dark",
  automaticLayout: true,
  fontSize: 14,
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  wordWrap: "on",
  tabSize: 2,
  formatOnPaste: true,
  formatOnType: true
}
```

#### 4.2.2 Multi-Language Support

**Supported Languages via Piston API:**

| Language | Version | Features |
|----------|---------|----------|
| JavaScript | 18.15.0 | Full ES6+, Node.js runtime |
| TypeScript | 5.0.3 | Type checking, transpilation |
| Python | 3.10.0 | Standard library, pip packages |
| Java | 15.0.2 | JDK, compilation + execution |
| C# | 6.12.0 | .NET runtime |
| PHP | 8.2.3 | Web scripting |
| C | 10.2.0 | GCC compiler |
| C++ | 10.2.0 | G++ compiler, STL |
| Go | 1.16.2 | Full Go runtime |
| Rust | 1.68.2 | Cargo build system |
| Ruby | 3.0.1 | Ruby runtime |
| Kotlin | 1.8.20 | JVM compilation |
| HTML/CSS | N/A | Live preview panel |

#### 4.2.3 Code Execution Flow

**Piston API Integration:**
```javascript
async function executeCode(language, code, stdin) {
  const response = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: language,
      version: getLanguageVersion(language),
      files: [{
        name: getFileName(language),
        content: code
      }],
      stdin: stdin || ""
    })
  });
  
  const result = await response.json();
  return {
    stdout: result.run.stdout,
    stderr: result.run.stderr,
    exitCode: result.run.code,
    executionTime: result.run.time
  };
}
```

**Execution Flow:**
1. User writes code in Monaco editor
2. Clicks "Run" button
3. Code sent to Piston API with language metadata
4. Piston compiles (if needed) and executes in sandbox
5. Output (stdout/stderr) returned to frontend
6. Results displayed in output panel
7. Execution time and status shown

#### 4.2.4 File Management System

**Multi-File Support:**
- Create, rename, delete files
- File tree navigation
- Persistent storage in `Lab` model
- JSON storage for file structure

**Lab Storage:**
```python
{
  "name": "My React Project",
  "language": "javascript",
  "files": {
    "index.js": "console.log('Hello');",
    "utils.js": "export function add(a, b) { return a + b; }",
    "package.json": "{\"name\": \"project\"}"
  },
  "created_at": timestamp,
  "updated_at": timestamp
}
```

#### 4.2.5 HTML/CSS Live Preview

**Preview Panel:**
- Real-time rendering of HTML/CSS/JS
- iframe-based isolation
- Auto-refresh on code changes
- Responsive viewport controls
- DevTools-style console output

**Preview Implementation:**
```javascript
const previewHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>${cssCode}</style>
</head>
<body>
  ${htmlCode}
  <script>${jsCode}</script>
</body>
</html>
`;

iframeRef.current.srcdoc = previewHTML;
```

### 4.3 Mock Interview Simulator

#### 4.3.1 Architecture & Technology

**Real-Time Communication:**
- **Protocol**: WebSocket (WSS)
- **Server**: Django Channels + Daphne
- **Client**: Custom React hook (`useInterviewWebSocket`)
- **Message Format**: JSON

**WebSocket Message Types:**
```javascript
// Client → Server
{
  type: "INIT_SESSION",
  data: { topic: "React", difficulty: "medium", duration: 30 }
}

{
  type: "USER_ANSWER",
  data: { answer: "React is a JavaScript library...", questionId: 1 }
}

{
  type: "END_SESSION",
  data: { sessionId: uuid }
}

// Server → Client
{
  type: "QUESTION",
  data: { 
    id: 1, 
    question: "What is the virtual DOM?",
    context: "Fundamentals"
  }
}

{
  type: "ANALYSIS",
  data: {
    score: 85,
    strengths: ["Clear explanation", "Good examples"],
    weaknesses: ["Missing edge cases"],
    feedback: "Overall strong response..."
  }
}
```

#### 4.3.2 AI Interviewer Persona

**Interviewer Profile:**
- **Name**: Alex
- **Title**: Senior Technical Interviewer at Top Tech Company
- **Style**: Professional, direct, rigorous but fair
- **Personality**: Encouraging yet thorough, asks follow-up questions

**System Prompt:**
```
You are Alex, a senior technical interviewer at a top technology company.
You are conducting a [DIFFICULTY] level interview on [TOPIC].

Style Guidelines:
- Be professional and direct
- Ask clear, specific questions
- Follow up on vague answers
- Provide constructive feedback
- Adjust difficulty based on responses
- Stay in character throughout

Interview Structure:
1. Opening question (fundamentals)
2. Follow-up questions based on answers
3. Progressive difficulty increase
4. Practical problem-solving scenarios
5. Closing question (advanced topic)

Duration: [DURATION] minutes
```

#### 4.3.3 Interview Flow

**Session Lifecycle:**

1. **Initialization:**
   - User selects topic (React, Node.js, System Design, DSA, Behavioral)
   - Chooses difficulty (Easy, Medium, Hard)
   - Sets duration (15, 30, 45 minutes)
   - WebSocket connection established

2. **Interview Progression:**
   ```
   [Opening] → [Questions Loop] → [Closing] → [Analysis]
   
   Questions Loop:
   - AI asks question
   - User responds (speech-to-text or typing)
   - AI evaluates answer quality
   - AI generates follow-up or next question
   - Repeat until time limit
   ```

3. **Real-Time Interaction:**
   - Speech recognition via Web Speech API
   - Typing fallback for text responses
   - Live transcript display
   - Question history sidebar

4. **Session End:**
   - User clicks "End Interview" or time expires
   - AI analyzes full transcript
   - Performance report generated
   - Results saved to `InterviewSession` model

#### 4.3.4 Performance Analysis

**Analysis Dimensions:**
```javascript
{
  overallScore: 85,  // 0-100
  
  strengths: [
    "Clear and structured explanations",
    "Good use of technical terminology",
    "Practical examples provided"
  ],
  
  weaknesses: [
    "Could elaborate more on edge cases",
    "Hesitation on advanced topics",
    "Missing some optimization considerations"
  ],
  
  topicBreakdown: {
    "React Fundamentals": 90,
    "State Management": 80,
    "Performance Optimization": 75
  },
  
  feedback: `
    Strong performance overall. You demonstrated solid understanding
    of React fundamentals and component lifecycle. To improve, focus
    on performance optimization techniques and edge case handling.
  `,
  
  recommendations: [
    "Study React performance profiling tools",
    "Practice explaining complex concepts simply",
    "Review common interview patterns"
  ]
}
```

**Database Model: `InterviewSession`**
```python
{
  "user": ForeignKey(User),
  "topic": CharField(),
  "difficulty": CharField(),
  "duration": IntegerField(),  # minutes
  "score": IntegerField(),
  "feedback": TextField(),
  "strengths": JSONField(),
  "weaknesses": JSONField(),
  "transcript": TextField(),
  "created_at": DateTimeField(),
  "completed_at": DateTimeField()
}
```

### 4.4 Mentor Connect Platform

#### 4.4.1 Mentor Profiles & Marketplace

**Profile Information:**
- Full name, profile photo (DiceBear avatars)
- Professional title (e.g., "Senior SDE @ Google")
- Company affiliation
- Years of experience
- Expertise areas (tags: React, Python, System Design, etc.)
- Hourly rate (INR/USD)
- Average rating (1-5 stars)
- Total sessions conducted
- LinkedIn profile link
- About/bio section

**Discovery & Search:**
- Browse all verified mentors
- Filter by skills, price range, rating
- Sort by rating, price, experience
- Search by name or expertise
- View detailed mentor profiles

#### 4.4.2 Booking System

**Availability Management (Mentor Side):**
```python
# MentorSlot Model
{
  "mentor": ForeignKey(MentorProfile),
  "start_time": DateTimeField(),
  "end_time": DateTimeField(),
  "is_booked": BooleanField(),
  "created_at": DateTimeField()
}
```

**Mentors can:**
- Create availability slots (date, time, duration)
- Set recurring availability (weekly patterns)
- Mark slots as unavailable
- View upcoming bookings

**Booking Flow (Learner Side):**
1. Browse mentors or search by skills
2. Select mentor profile
3. View available time slots
4. Click "Book Session"
5. Fill booking form:
   - Select time slot
   - Enter topic/questions
   - Confirm pricing
6. Payment UI (Razorpay integration mockup)
7. Booking request submitted

**Booking States:**
- **PENDING**: Awaiting mentor confirmation
- **CONFIRMED**: Mentor accepted, meeting link generated
- **COMPLETED**: Session finished
- **CANCELLED**: Cancelled by either party

**Database Model: `Booking`**
```python
{
  "learner": ForeignKey(User),
  "mentor": ForeignKey(MentorProfile),
  "slot": OneToOne(MentorSlot),
  "status": CharField(choices=["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
  "meeting_link": URLField(),
  "topic": TextField(),
  "amount_paid": DecimalField(),
  "payment_id": CharField(),
  "created_at": DateTimeField(),
  "updated_at": DateTimeField()
}
```

#### 4.4.3 Video Meeting Integration

**Planned Integration: LiveKit**
- WebRTC-based video calling
- Screen sharing capability
- Recording support (with consent)
- Chat messaging
- Session quality metrics

**Meeting Room Flow:**
1. Mentor confirms booking
2. System generates LiveKit room token
3. Meeting link created: `/room/{roomId}`
4. Both parties join at scheduled time
5. Video call conducted via LiveKit
6. Session auto-ends after duration
7. Feedback requested from learner

**Current Implementation:**
- Placeholder meeting room UI
- Video grid layout (2x2 for 4 participants)
- Chat panel
- Screen share button
- Leave meeting button

#### 4.4.4 Mentor Dashboard

**Analytics Displayed:**
- Total earnings (lifetime)
- Completed sessions count
- Average rating
- Upcoming sessions (calendar view)
- Session history with learner details
- Payment transaction log

**Dashboard Sections:**
1. **Overview**: Key metrics and charts
2. **Sessions**: Upcoming and past bookings
3. **Availability**: Manage time slots
4. **Payments**: Earning history and withdrawals
5. **Profile**: Edit mentor information

**Revenue Tracking:**
```python
# MentorProfile additional fields
{
  "total_earnings": DecimalField(),
  "average_rating": FloatField(),
  "total_sessions": IntegerField(),
  "response_rate": FloatField(),  # % of bookings accepted
  "is_verified": BooleanField()
}
```

---

## 5. Notification & Engagement System

### 5.1 Email Notifications (Gmail SMTP)

**Configuration:**
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
```

**Notification Types:**

1. **Daily Learning Reminder**
   - Trigger: 9 AM daily (scheduled task)
   - Recipients: Users with incomplete daily tasks
   - Content: Today's tasks list, current streak, motivational message

2. **Achievement Notifications**
   - Trigger: Milestone reached (concept completed, streak milestone, course completion)
   - Content: Congratulations message, badge earned, next goal suggestion

3. **Missed Task Alert**
   - Trigger: End of day with incomplete tasks
   - Content: Missed tasks list, streak at risk warning, encouragement

4. **Course Completion**
   - Trigger: 100% roadmap completion
   - Content: Congratulations, certificate attached as PDF, next course suggestions

5. **Assessment Failure**
   - Trigger: Score < 70%
   - Content: Encouragement, recommendation to review notes, retake link

**Email Template Example:**
```html
Subject: 🔥 Your SkillMeter Streak: 7 Days!

Hi {user.first_name},

Congratulations! You've maintained a 7-day learning streak! 🎉

Today's Tasks:
• Watch "React Hooks Deep Dive" (30 min)
• Complete Quiz: React Hooks
• Practice: Build a custom hook

Keep going! You're on track to complete "React Mastery" in 14 days.

[View Dashboard] [Mark Tasks Complete]

Best,
SkillMeter AI Team
```

### 5.2 WhatsApp Notifications (Twilio)

**Integration:**
```python
from twilio.rest import Client

client = Client(
    os.getenv('TWILIO_ACCOUNT_SID'),
    os.getenv('TWILIO_AUTH_TOKEN')
)

def send_whatsapp(user, message):
    client.messages.create(
        from_=f'whatsapp:{TWILIO_WHATSAPP_NUMBER}',
        to=f'whatsapp:{user.learnerprofile.phone_number}',
        body=message
    )
```

**WhatsApp Use Cases:**
- **Course Completion**: "🎓 Congratulations! You've completed [Course Name]. Your certificate is ready!"
- **Streak Milestones**: "🔥 Amazing! 30-day learning streak achieved!"
- **Daily Reminder**: "📚 Good morning! 3 tasks pending for today."

**Limitations:**
- Requires user opt-in for WhatsApp communication
- Limited to text messages (no rich media in sandbox)
- Rate limits apply per Twilio plan

### 5.3 In-App Notifications

**Notification Bell:**
- Icon in header with badge count
- Dropdown panel showing recent notifications
- Mark as read functionality
- Clear all option

**Notification Types:**
```javascript
{
  type: "REMINDER",     // Daily task reminders
  type: "ACHIEVEMENT",  // Milestones reached
  type: "MISSED",       // Missed tasks
  type: "SYSTEM"        // Platform updates
}
```

**Database Model: `Notification`**
```python
{
  "user": ForeignKey(User),
  "notification_type": CharField(),
  "title": CharField(),
  "message": TextField(),
  "read": BooleanField(),
  "created_at": DateTimeField()
}
```

**Real-Time Updates:**
- Polling: Every 60 seconds, check for new notifications
- Badge count updates automatically
- Toast notification for new urgent alerts

### 5.4 Notification Logging

**Purpose:**
- Audit trail for all sent notifications
- Debugging delivery issues
- Analytics on notification engagement

**Database Model: `NotificationLog`**
```python
{
  "user": ForeignKey(User),
  "notification_type": CharField(choices=["EMAIL", "WHATSAPP", "SYSTEM"]),
  "event_name": CharField(),
  "recipient": CharField(),
  "status": CharField(choices=["SENT", "FAILED"]),
  "error_message": TextField(),
  "created_at": DateTimeField()
}
```

**Admin Dashboard:**
- View all notification logs
- Filter by user, type, status, date
- Retry failed notifications
- Analytics: delivery rates, failure patterns

---

## 6. Certification & Verification

### 6.1 Certificate Generation

**Trigger Conditions:**
- Roadmap progress = 100%
- All concepts marked complete
- All assessments passed (score ≥ 70%)

**Generation Process:**

1. **Certificate ID Creation:**
   ```python
   import hashlib
   from datetime import datetime
   
   cert_data = f"{user.id}_{roadmap.id}_{datetime.now().isoformat()}"
   certificate_id = hashlib.sha256(cert_data.encode()).hexdigest()[:16]
   ```

2. **PDF Creation (ReportLab):**
   ```python
   from reportlab.lib.pagesizes import A4
   from reportlab.pdfgen import canvas
   from reportlab.lib.utils import ImageReader
   
   def generate_certificate(user, course, cert_id):
       pdf_path = f"certificates/{cert_id}.pdf"
       c = canvas.Canvas(pdf_path, pagesize=A4)
       
       # Add decorative border
       draw_border(c)
       
       # Add SkillMeter logo
       logo = ImageReader('static/images/logo.png')
       c.drawImage(logo, 250, 700, width=100, height=100)
       
       # Add certificate text
       c.setFont("Helvetica-Bold", 24)
       c.drawCentredString(300, 600, "Certificate of Completion")
       
       c.setFont("Helvetica", 16)
       c.drawCentredString(300, 550, f"This is to certify that")
       
       c.setFont("Helvetica-Bold", 20)
       c.drawCentredString(300, 510, user.get_full_name())
       
       c.setFont("Helvetica", 16)
       c.drawCentredString(300, 460, f"has successfully completed")
       
       c.setFont("Helvetica-Bold", 18)
       c.drawCentredString(300, 420, course.title)
       
       # Add completion date
       c.setFont("Helvetica", 14)
       date_str = datetime.now().strftime("%B %d, %Y")
       c.drawCentredString(300, 350, f"Completion Date: {date_str}")
       
       # Add QR code
       qr_img = generate_qr_code(cert_id)
       c.drawImage(qr_img, 250, 150, width=100, height=100)
       
       c.setFont("Helvetica", 10)
       c.drawCentredString(300, 130, f"Certificate ID: {cert_id}")
       c.drawCentredString(300, 115, "Scan QR to verify authenticity")
       
       c.save()
       return pdf_path
   ```

3. **QR Code Generation:**
   ```python
   import qrcode
   from io import BytesIO
   
   def generate_qr_code(cert_id):
       verify_url = f"https://skillmeter.ai/verify?id={cert_id}"
       qr = qrcode.QRCode(version=1, box_size=10, border=5)
       qr.add_data(verify_url)
       qr.make(fit=True)
       img = qr.make_image(fill_color="black", back_color="white")
       return img
   ```

### 6.2 Certificate Delivery

**Multi-Channel Delivery:**

1. **Email:**
   - Subject: "🎓 Your SkillMeter Certificate is Ready!"
   - Attachment: PDF certificate
   - Body: Congratulations message, verification instructions

2. **WhatsApp:**
   - Message: "Congratulations! You've earned your [Course Name] certificate. Check your email for the PDF."

3. **In-App:**
   - Dashboard banner: "Certificate Available"
   - Download button
   - Share to LinkedIn option

### 6.3 Public Verification System

**Verification Page:**
- Public route: `/verify?id={certificate_id}`
- No authentication required
- Accessible to anyone (employers, institutions)

**Verification Flow:**

1. User/employer scans QR code or visits verification URL
2. Frontend sends certificate ID to backend
3. Backend queries database:
   ```python
   def verify_certificate(cert_id):
       try:
           roadmap = Roadmap.objects.get(certificate_id=cert_id)
           return {
               "valid": True,
               "student_name": roadmap.user.get_full_name(),
               "course_name": roadmap.course.title,
               "completion_date": roadmap.completed_at,
               "issued_by": "SkillMeter AI"
           }
       except Roadmap.DoesNotExist:
           return {"valid": False, "error": "Certificate not found"}
   ```
4. Frontend displays verification result

**Verification UI:**
```
┌─────────────────────────────────────┐
│  ✅ Certificate Verified             │
│                                      │
│  Student: John Doe                   │
│  Course: React Mastery               │
│  Completed: January 15, 2026         │
│  Issued by: SkillMeter AI            │
│                                      │
│  Certificate ID: a3f7c9e21b4d8f6a   │
└─────────────────────────────────────┘
```

---

## 7. Technical Architecture

### 7.1 Database Schema (17 Models)

#### User & Profile Models

**`LearnerProfile`**
```python
{
  "user": OneToOneField(User, on_delete=CASCADE),
  "skill_level": CharField(max_length=20, choices=SKILL_LEVELS),
  "learning_goals": JSONField(),
  "daily_study_time": IntegerField(),
  "phone_number": CharField(max_length=15),
  "onboarding_completed": BooleanField(default=False)
}
```

**`MentorProfile`**
```python
{
  "user": OneToOneField(User, on_delete=CASCADE),
  "title": CharField(max_length=200),
  "company": CharField(max_length=100),
  "hourly_rate": DecimalField(max_digits=8, decimal_places=2),
  "about": TextField(),
  "skills": JSONField(),
  "availability": JSONField(),
  "is_verified": BooleanField(default=False),
  "total_earnings": DecimalField(max_digits=10, decimal_places=2),
  "average_rating": FloatField(default=0.0)
}
```

#### Course Content Models

**`Course`**
```python
{
  "title": CharField(max_length=200),
  "description": TextField(),
  "thumbnail": URLField(),
  "difficulty": CharField(choices=DIFFICULTY_LEVELS),
  "estimated_hours": IntegerField(),
  "tags": JSONField(),
  "created_at": DateTimeField(auto_now_add=True)
}
```

**`Chapter`**
```python
{
  "course": ForeignKey(Course, on_delete=CASCADE),
  "title": CharField(max_length=200),
  "description": TextField(),
  "order": IntegerField(),
  "created_at": DateTimeField(auto_now_add=True)
}
```

**`Concept`**
```python
{
  "chapter": ForeignKey(Chapter, on_delete=CASCADE),
  "title": CharField(max_length=200),
  "description": TextField(),
  "duration": IntegerField(),  # minutes
  "video_url": URLField(),
  "notes": TextField(),  # Markdown format
  "content_type": CharField(choices=["video", "article", "exercise"]),
  "order": IntegerField(),
  "created_at": DateTimeField(auto_now_add=True)
}
```

#### Progress Tracking Models

**`Roadmap`** (User enrollment)
```python
{
  "user": ForeignKey(User, on_delete=CASCADE),
  "course": ForeignKey(Course, on_delete=CASCADE),
  "progress": FloatField(default=0.0),  # 0-100%
  "current_chapter": ForeignKey(Chapter, null=True),
  "current_concept": ForeignKey(Concept, null=True),
  "started_at": DateTimeField(auto_now_add=True),
  "last_accessed_at": DateTimeField(auto_now=True),
  "completed_at": DateTimeField(null=True),
  "certificate_id": CharField(max_length=64, unique=True, null=True)
}
```

**`ConceptProgress`**
```python
{
  "user": ForeignKey(User, on_delete=CASCADE),
  "concept": ForeignKey(Concept, on_delete=CASCADE),
  "completed": BooleanField(default=False),
  "completed_at": DateTimeField(null=True),
  "UNIQUE_TOGETHER": ["user", "concept"]
}
```

**`UserProgress`** (Overall stats)
```python
{
  "user": OneToOneField(User, on_delete=CASCADE),
  "total_minutes_learned": IntegerField(default=0),
  "total_concepts_completed": IntegerField(default=0),
  "total_assessments_taken": IntegerField(default=0),
  "average_score": FloatField(default=0.0),
  "current_streak": IntegerField(default=0),
  "longest_streak": IntegerField(default=0),
  "last_activity_date": DateField(null=True)
}
```

#### Assessment Models

**`Assessment`**
```python
{
  "concept": ForeignKey(Concept, on_delete=CASCADE),
  "questions": JSONField(),  # Array of question objects
  "time_limit": IntegerField(),  # minutes
  "created_at": DateTimeField(auto_now_add=True)
}
```

**`AssessmentResult`**
```python
{
  "user": ForeignKey(User, on_delete=CASCADE),
  "assessment": ForeignKey(Assessment, on_delete=CASCADE),
  "score": FloatField(),
  "answers": JSONField(),
  "completed_at": DateTimeField(auto_now_add=True)
}
```

#### Engagement Models

**`DailyTask`**
```python
{
  "user": ForeignKey(User, on_delete=CASCADE),
  "concept": ForeignKey(Concept, on_delete=CASCADE),
  "task_type": CharField(choices=["video", "notes", "assessment"]),
  "title": CharField(max_length=200),
  "scheduled_date": DateField(),
  "completed": BooleanField(default=False),
  "completed_at": DateTimeField(null=True)
}
```

**`Notification`**
```python
{
  "user": ForeignKey(User, on_delete=CASCADE),
  "notification_type": CharField(choices=NOTIFICATION_TYPES),
  "title": CharField(max_length=200),
  "message": TextField(),
  "read": BooleanField(default=False),
  "created_at": DateTimeField(auto_now_add=True)
}
```

**`NotificationLog`**
```python
{
  "user": ForeignKey(User, on_delete=CASCADE),
  "notification_type": CharField(choices=["EMAIL", "WHATSAPP"]),
  "event_name": CharField(max_length=100),
  "recipient": CharField(max_length=200),
  "status": CharField(choices=["SENT", "FAILED"]),
  "error_message": TextField(null=True),
  "created_at": DateTimeField(auto_now_add=True)
}
```

#### Feature-Specific Models

**`Lab`** (Code playground)
```python
{
  "user": ForeignKey(User, on_delete=CASCADE),
  "name": CharField(max_length=200),
  "language": CharField(max_length=50),
  "files": JSONField(),  # {filename: content}
  "created_at": DateTimeField(auto_now_add=True),
  "updated_at": DateTimeField(auto_now=True)
}
```

**`StudySession`** (Focus monitoring)
```python
{
  "user": ForeignKey(User, on_delete=CASCADE),
  "started_at": DateTimeField(),
  "ended_at": DateTimeField(null=True),
  "total_duration": IntegerField(),  # seconds
  "focus_duration": IntegerField(),  # seconds
  "distraction_count": IntegerField(),
  "focus_percentage": FloatField()
}
```

**`MentorSlot`**
```python
{
  "mentor": ForeignKey(MentorProfile, on_delete=CASCADE),
  "start_time": DateTimeField(),
  "end_time": DateTimeField(),
  "is_booked": BooleanField(default=False),
  "created_at": DateTimeField(auto_now_add=True)
}
```

**`Booking`**
```python
{
  "learner": ForeignKey(User, on_delete=CASCADE, related_name="bookings"),
  "mentor": ForeignKey(MentorProfile, on_delete=CASCADE),
  "slot": OneToOneField(MentorSlot, on_delete=CASCADE),
  "status": CharField(choices=BOOKING_STATUSES),
  "meeting_link": URLField(null=True),
  "topic": TextField(),
  "amount_paid": DecimalField(max_digits=10, decimal_places=2),
  "payment_id": CharField(max_length=100, null=True),
  "created_at": DateTimeField(auto_now_add=True),
  "updated_at": DateTimeField(auto_now=True)
}
```

**`InterviewSession`**
```python
{
  "user": ForeignKey(User, on_delete=CASCADE),
  "topic": CharField(max_length=100),
  "difficulty": CharField(choices=DIFFICULTY_LEVELS),
  "duration": IntegerField(),  # minutes
  "score": IntegerField(null=True),
  "feedback": TextField(null=True),
  "strengths": JSONField(null=True),
  "weaknesses": JSONField(null=True),
  "transcript": TextField(null=True),
  "created_at": DateTimeField(auto_now_add=True),
  "completed_at": DateTimeField(null=True)
}
```

### 7.2 API Architecture

**80+ RESTful Endpoints**

#### Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/auth/register/` | User registration | `{username, email, password, first_name, last_name}` | `{user, tokens}` |
| POST | `/api/auth/login/` | User login | `{email or username, password}` | `{user, access, refresh}` |
| POST | `/api/auth/logout/` | Logout | `{refresh}` | `{message}` |
| POST | `/api/auth/refresh/` | Token refresh | `{refresh}` | `{access}` |
| GET/PUT | `/api/auth/user/` | Current user profile | `{first_name, last_name, ...}` | `{user}` |

#### Profile Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/profile/` | Learner profile CRUD |
| GET | `/api/progress/` | User learning statistics |
| GET | `/api/activity/` | Activity log (contribution graph data) |

#### Course & Learning Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/` | List all available courses |
| GET | `/api/courses/{id}/` | Course details with chapters |
| GET/POST | `/api/roadmaps/` | List/create user roadmaps |
| POST | `/api/roadmaps/generate/` | AI-generate new roadmap |
| GET/PUT/DELETE | `/api/roadmaps/{id}/` | Roadmap CRUD |
| GET | `/api/roadmaps/{id}/certificate/` | Download certificate PDF |
| POST | `/api/concepts/{id}/complete/` | Mark concept complete |
| POST | `/api/concepts/{id}/generate-notes/` | AI-generate notes |
| POST | `/api/concepts/{id}/generate-quiz/` | AI-generate quiz |

#### Assessment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessments/{id}/` | Get assessment questions |
| POST | `/api/assessments/{id}/submit/` | Submit assessment answers |

#### Task & Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/` | Today's tasks |
| POST | `/api/tasks/{id}/complete/` | Mark task complete |
| GET | `/api/notifications/` | All notifications |
| POST | `/api/notifications/{id}/read/` | Mark as read |

#### Lab & Study Session Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/labs/` | List/create labs |
| GET/PUT/DELETE | `/api/labs/{id}/` | Lab CRUD |
| GET/POST | `/api/study-sessions/` | List/create study sessions |
| GET | `/api/study-sessions/stats/` | Focus statistics |

#### Mentor & Booking Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/mentors/` | List mentors / Become mentor |
| GET | `/api/mentors/{id}/` | Mentor details |
| POST | `/api/bookings/request/` | Request mentor session |
| GET | `/api/bookings/my-sessions/` | Learner's bookings |
| GET | `/api/bookings/mentor-sessions/` | Mentor's bookings |
| POST | `/api/bookings/{id}/status/` | Update booking status |

#### Mentor Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mentor/stats/` | Mentor dashboard statistics |
| GET/POST | `/api/mentor/availability/` | Manage availability slots |
| GET | `/api/mentor/payments/` | Payment history |

#### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hello/` | Health check |
| GET | `/api/leaderboard/` | Top 5 learners by score |
| GET | `/api/trending/` | Trending topics/courses |
| GET | `/api/certificates/verify/{id}/` | Verify certificate |

### 7.3 External Service Integration

#### Google Gemini AI

**Model:** `gemini-3-flash-preview`

**Use Cases:**
1. **Roadmap Generation**
   - Input: Topic, skill level, study time, goals
   - Output: Complete course structure (JSON)
   - Prompt: Structured generation with specific format

2. **Notes Generation**
   - Input: Video title, transcript, topic
   - Output: Markdown study notes
   - Prompt: Concise summary with key points

3. **Quiz Generation**
   - Input: Concept notes, difficulty level
   - Output: Array of MCQ questions
   - Prompt: Create questions with explanations

4. **Interview AI**
   - Input: Topic, difficulty, conversation history
   - Output: Interview questions and analysis
   - Prompt: Act as technical interviewer

**Configuration:**
```python
import google.generativeai as genai

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-3-flash-preview')

def generate_content(prompt):
    response = model.generate_content(prompt)
    return response.text
```

#### YouTube Data API v3

**Quota Management:**
- Daily quota: 10,000 units
- Search costs: 100 units per request
- Video details: 1 unit per request
- Fallback: Direct YouTube search URLs if quota exceeded

**Search Implementation:**
```python
from googleapiclient.discovery import build

youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

def search_video(query):
    try:
        request = youtube.search().list(
            part='snippet',
            q=query,
            type='video',
            maxResults=10,
            order='relevance',
            videoDefinition='high'
        )
        response = request.execute()
        
        videos = []
        for item in response['items']:
            videos.append({
                'video_id': item['id']['videoId'],
                'title': item['snippet']['title'],
                'thumbnail': item['snippet']['thumbnails']['high']['url'],
                'video_url': f"https://www.youtube.com/watch?v={item['id']['videoId']}"
            })
        return videos[0] if videos else None
    except Exception as e:
        # Quota exceeded or API error
        return {
            'video_url': f"https://www.youtube.com/results?search_query={query}",
            'thumbnail': None
        }
```

#### Twilio (WhatsApp & SMS)

**WhatsApp Messaging:**
```python
from twilio.rest import Client

def send_whatsapp_notification(user, message):
    client = Client(
        os.getenv('TWILIO_ACCOUNT_SID'),
        os.getenv('TWILIO_AUTH_TOKEN')
    )
    
    try:
        message = client.messages.create(
            from_=f'whatsapp:{TWILIO_WHATSAPP_NUMBER}',
            to=f'whatsapp:{user.learnerprofile.phone_number}',
            body=message
        )
        return {"status": "SENT", "sid": message.sid}
    except Exception as e:
        return {"status": "FAILED", "error": str(e)}
```

#### Piston API (Code Execution)

**Language Support:**
- JavaScript, TypeScript, Python, Java, C#, PHP
- C, C++, Go, Rust, Ruby, Kotlin

**Execution Request:**
```python
import requests

def execute_code(language, code, stdin=""):
    url = "https://emkc.org/api/v2/piston/execute"
    payload = {
        "language": language,
        "version": get_language_version(language),
        "files": [{
            "name": get_filename(language),
            "content": code
        }],
        "stdin": stdin
    }
    
    response = requests.post(url, json=payload)
    result = response.json()
    
    return {
        "stdout": result.get("run", {}).get("stdout", ""),
        "stderr": result.get("run", {}).get("stderr", ""),
        "exit_code": result.get("run", {}).get("code", 0)
    }
```

---

## 8. User Experience & Interface

### 8.1 Design System

**Neo-Brutalist Aesthetic:**
- **Colors**: High contrast black/white with vibrant accent colors (#1F4788, #2E5C8A)
- **Typography**: Bold headings (Arial), clean body text
- **Shadows**: Hard-edged box shadows (`shadow-[6px_6px_0px_0px_#000]`)
- **Borders**: 2px solid black, no border-radius (`rounded-none`)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Spacing**: Generous whitespace, clear visual hierarchy

**Color Palette:**
```css
Primary: #1F4788 (Deep Blue)
Secondary: #2E5C8A (Medium Blue)
Accent: #446B8C (Light Blue)
Background: #FFFFFF (White)
Text: #000000 (Black)
Error: #DC2626 (Red)
Success: #16A34A (Green)
Warning: #EAB308 (Yellow)
```

### 8.2 Component Library (55+ shadcn/ui Components)

**Layout Components:**
- Card, Separator, Scroll Area, Resizable Panels, Aspect Ratio

**Form Components:**
- Button, Input, Textarea, Select, Checkbox, Radio Group, Switch, Slider, Label

**Feedback Components:**
- Toast (Sonner), Alert, Badge, Progress, Skeleton, Spinner

**Overlay Components:**
- Dialog, Drawer, Sheet, Popover, Tooltip, Hover Card, Context Menu

**Navigation Components:**
- Tabs, Accordion, Collapsible, Navigation Menu, Menubar, Breadcrumb

**Data Display:**
- Table, Avatar, Calendar, Chart (Recharts), Command

**Custom Animated Components:**
- Particles, Retro Grid, Letter Swap, Rocket Launch, Twitter Testimonials

### 8.3 Page-by-Page Overview (19 Pages)

#### Public Pages

**Landing Page** (`Landing.jsx`)
- Hero section with product tagline
- Feature showcase (AI roadmaps, focus monitoring, code playground)
- Testimonials carousel
- Pricing (Free tier focus)
- Call-to-action buttons (Sign Up, Try Demo)

**Login Page** (`Login.jsx`)
- Email/username + password form
- Remember me checkbox
- Forgot password link
- Social login buttons (future)
- Link to signup page

**Signup Page** (`Signup.jsx`)
- Registration form (username, email, password, name)
- Password strength indicator
- Terms of service checkbox
- Link to login page

**Onboarding Page** (`Onboarding.jsx`)
- Multi-step wizard
  1. Welcome screen
  2. Skill level selection
  3. Learning goals input
  4. Daily study time selection
  5. Phone number (optional)
- Progress indicator
- Skip/Next buttons

#### Protected Pages

**Dashboard** (`Dashboard.jsx`)
- Welcome banner with user name
- Key metrics cards:
  - Total learning time
  - Current streak
  - Concepts completed
  - Average assessment score
- Active roadmaps list
- Today's tasks section
- Recent notifications
- Quick actions (Start Learning, Practice Code, Find Mentor)

**Roadmap** (`Roadmap.jsx`)
- Course header (title, description, progress bar)
- Chapters accordion
- Concepts list with completion checkmarks
- "Start Concept" buttons
- Certificate download (if 100% complete)

**Learn** (`Learn.jsx`)
- Video player (YouTube embed)
- Tabs: Watch, Notes, Quiz
- Navigation: Previous/Next concept
- Progress indicator
- Mark Complete button
- AI-generated notes (Markdown)
- Quiz interface with timer

**Progress** (`Progress.jsx`)
- Analytics dashboard
- Charts:
  - Learning time over time (line chart)
  - Concepts completed by chapter (bar chart)
  - Assessment scores (area chart)
- Contribution graph (GitHub-style)
- Streak stats
- Leaderboard position

**Notifications** (`Notifications.jsx`)
- Notification list with filters (All, Unread, Read)
- Mark as read/unread buttons
- Clear all option
- Notification details modal

**Profile** (`Profile.jsx`)
- User information form
- Profile picture upload
- Learner profile settings
- Notification preferences
- Account settings (password change, delete account)

**Practice Lab** (`PracticeLab.jsx`)
- Monaco code editor
- Language selector dropdown
- File management sidebar
- Run button
- Output panel (stdout/stderr)
- Save lab button
- My Labs list

**Study Room** (`StudyRoom.jsx`)
- Webcam feed with face mesh overlay
- Start/Stop session buttons
- Real-time metrics:
  - Session timer
  - Focus percentage
  - Distraction count
- Direction indicator (Forward, Left, Right, Up, Down)
- Session history

**Mentor Connect** (`MentorConnect.jsx`)
- Tabs: Find Mentors, Mock Interview, My Sessions
- Mentor cards with avatars, skills, pricing, ratings
- Book Session button
- Mock Interview: Topic selector, Start button
- Interview interface: AI questions, response input, transcript
- My Sessions: Upcoming and past bookings

**Mentor Dashboard** (`MentorDashboard.jsx`)
- Mentor-specific analytics
- Earnings overview
- Session calendar
- Booking requests list
- Availability management
- Payment history

**Meeting Room** (`MeetingRoom.jsx`)
- Video grid (mentor + learner webcams)
- Screen share panel
- Chat sidebar
- Leave meeting button
- Session timer

**Settings** (`Settings.jsx`)
- General settings
- Notification settings (email, WhatsApp toggle)
- Privacy settings
- Theme selection (Dark/Light)
- Language preference

**Verify Certificate** (`VerifyCertificate.jsx`)
- Certificate ID input field
- Verify button
- Verification result card
- Download certificate option (if valid)

**404 Not Found** (`NotFound.jsx`)
- Custom 404 illustration
- "Page not found" message
- Back to home button

---

## 9. Success Metrics & KPIs

### 9.1 User Engagement Metrics

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| **DAU** | Daily Active Users | 1,000 in 3 months | Login events per day |
| **MAU** | Monthly Active Users | 5,000 in 6 months | Unique users per month |
| **Session Duration** | Avg time per session | 30+ minutes | Session start/end timestamps |
| **Sessions per User** | Avg sessions per week | 4+ | User login frequency |
| **Retention Rate** | % users returning after 30 days | 40% | Cohort analysis |

### 9.2 Learning Outcome Metrics

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| **Course Completion** | % of started courses finished | 25% | Roadmaps 100% complete |
| **Assessment Avg Score** | Mean score across all quizzes | 75% | Assessment results |
| **Concepts Mastered/Week** | Avg concepts completed weekly | 10+ | ConceptProgress records |
| **Time to Completion** | Avg days to finish a course | < estimated time | Roadmap start/end dates |
| **Retake Rate** | % assessments retaken | < 20% | Failed assessment retakes |

### 9.3 Feature Adoption Metrics

| Feature | Metric | Target | Measurement |
|---------|--------|--------|-------------|
| **AI Study Room** | % users who tried it | 30% | StudySession records |
| **Practice Lab** | % users who coded | 50% | Lab creation count |
| **Mock Interview** | % users who interviewed | 20% | InterviewSession records |
| **Mentor Connect** | % users who booked | 10% | Booking records |
| **Certificates** | % courses with certs issued | 25% | Certificate generation |

### 9.4 Platform Performance Metrics

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| **AI Roadmap Accuracy** | User satisfaction rating | 4.2/5 | Post-generation feedback |
| **Assessment Quality** | Relevance to content | 4.0/5 | User ratings |
| **Focus Monitoring Accuracy** | False positive rate | < 10% | User-reported errors |
| **Code Execution Success** | % successful runs | 95% | Piston API response codes |
| **API Response Time** | Avg time for API calls | < 500ms | Server logs |

### 9.5 Business Metrics (Mentor Platform)

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| **Mentor Onboarding** | New mentors per month | 50+ | MentorProfile creations |
| **Booking Conversion** | % profile views → bookings | 5% | Booking/view ratio |
| **Session Completion** | % bookings that complete | 90% | Booking status updates |
| **Avg Mentor Rating** | Mean rating across mentors | 4.5/5 | Booking feedback |
| **Platform Revenue** | Monthly mentor session fees | $5,000+ | Booking payment sums |

---

## 10. Future Development Roadmap

### 10.1 Phase 1: Core Platform Enhancement (Q2 2026)

**Infrastructure Improvements:**
- Migration from SQLite to PostgreSQL for production scalability
- Redis caching for frequently accessed data (courses, user profiles)
- CDN integration for static assets (images, videos)
- Load balancer setup for horizontal scaling

**Analytics Enhancements:**
- Advanced dashboard with predictive insights
- Learning path recommendations based on performance
- Personalized weekly progress reports
- A/B testing framework for feature optimization

**Mobile Experience:**
- Progressive Web App (PWA) support
- React Native mobile app (iOS + Android)
- Offline learning mode with content caching
- Push notifications for mobile devices

### 10.2 Phase 2: AI Capabilities Expansion (Q3 2026)

**AI Features:**
- Beyond Presence integration for AI avatar interviews
- Adaptive learning paths that adjust to performance
- AI-powered doubt resolution chatbot
- Personalized content recommendations engine
- Auto-generated flashcards for spaced repetition

**Content Expansion:**
- Support for additional platforms (Udemy, Coursera, edX)
- PDF/article-based learning paths
- Interactive coding challenges (LeetCode-style)
- Project-based learning tracks

### 10.3 Phase 3: Community & Collaboration (Q4 2026)

**Social Features:**
- Peer learning groups and discussion forums
- Follow system (connect with other learners)
- Share progress on social media
- Public learner profiles (optional)

**Collaboration Tools:**
- Collaborative coding sessions (CodeSandbox-like)
- Shared study rooms (multi-user focus monitoring)
- Team learning challenges
- Hackathon hosting platform

**Content Creation:**
- User-generated courses (community-contributed)
- Course review and rating system
- Discussion threads per concept
- Q&A section for each topic

### 10.4 Phase 4: Monetization & B2B (Q1 2027)

**Premium Subscription:**
- SkillMeter Pro tier ($9.99/month)
  - Unlimited AI-generated content
  - Priority access to mentors
  - Advanced analytics
  - Certificate customization
  - Ad-free experience

**B2B Solutions:**
- Corporate training programs for enterprises
- Team dashboards for managers
- Custom learning paths for companies
- Bulk licensing discounts
- API access for integrations

**Partnerships:**
- University partnerships for curriculum integration
- Employer partnerships for skill verification
- White-label licensing for educational institutions
- Certification partnerships (e.g., AWS, Google Cloud)

---

## 11. Risks & Mitigation Strategies

### 11.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| **API Quota Limits** | High | High | Implement caching, fallback URLs, quota monitoring, paid tiers |
| **AI Content Quality** | High | Medium | User feedback loop, content review system, prompt optimization |
| **Scalability Issues** | High | Medium | Database optimization, CDN, load balancing, horizontal scaling |
| **WebRTC Stability** | Medium | Medium | Fallback to simpler video solutions, LiveKit SLA monitoring |
| **Data Loss** | High | Low | Regular backups, replication, disaster recovery plan |

### 11.2 Product Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| **Low User Retention** | High | Medium | Gamification, personalized notifications, community features |
| **Poor Content Discovery** | Medium | Medium | Improve AI prompts, manual curation, user feedback |
| **Mentor Quality Issues** | Medium | Medium | Verification process, rating system, background checks |
| **Certificate Credibility** | Medium | Low | Partnerships with employers, rigorous assessments, QR verification |
| **Feature Overload** | Low | High | User onboarding improvements, progressive disclosure, tooltips |

### 11.3 Legal & Compliance Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| **GDPR Compliance** | High | Medium | Privacy policy, data encryption, user consent, right to deletion |
| **Content Copyright** | High | Low | Only link to public YouTube videos, user-generated content terms |
| **Payment Processing** | Medium | Low | Use established providers (Stripe, Razorpay), PCI compliance |
| **User Privacy** | High | Medium | Clear privacy policy, data minimization, secure storage |
| **Mentor Liability** | Medium | Low | Terms of service, mentor code of conduct, dispute resolution |

### 11.4 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| **Market Competition** | High | High | Focus on unique features (AI, focus monitoring), community building |
| **Revenue Uncertainty** | High | Medium | Diversify revenue (subscriptions, B2B, mentor commissions) |
| **Funding Challenges** | High | Medium | Bootstrap initially, seek grants, prepare investor pitch |
| **Talent Retention** | Medium | Medium | Equity incentives, remote work, growth opportunities |
| **Platform Dependency** | Medium | Medium | Diversify AI providers, YouTube alternatives, backup APIs |

---

## 12. Appendix

### 12.1 Technology Stack Summary

**Frontend:**
- React 18.3.1, Vite 5.4.19, TailwindCSS 3.4.17
- TanStack Query 5.83.0, React Router DOM 6.30.1
- Framer Motion 12.26.2, shadcn/ui (55+ components)
- Monaco Editor 0.55.1, MediaPipe Face Mesh 0.4.x
- react-markdown 10.1.0, Recharts 2.15.4

**Backend:**
- Django 5.2.10, Django REST Framework
- Django Channels, Daphne (WebSocket)
- SimpleJWT, django-cors-headers
- ReportLab, qrcode, Pillow

**External Services:**
- Google Gemini AI (gemini-3-flash-preview)
- YouTube Data API v3
- Twilio (WhatsApp, SMS)
- Gmail SMTP
- Piston API (code execution)
- LiveKit (planned - WebRTC)
- DiceBear (avatars)

### 12.2 Environment Variables Required

```env
# AI Services
GEMINI_API_KEY=your_gemini_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here

# Email (Gmail SMTP)
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password_here

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=your_twilio_sid_here
TWILIO_AUTH_TOKEN=your_twilio_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886

# LiveKit (Optional)
LIVEKIT_API_KEY=your_livekit_key_here
LIVEKIT_API_SECRET=your_livekit_secret_here
LIVEKIT_URL=wss://your-livekit-server

# Beyond Presence (Optional)
BEYOND_PRESENCE_API_KEY=your_bp_key_here

# Django
SECRET_KEY=your_django_secret_key_here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

### 12.3 API Documentation Links

- **Google Gemini AI**: https://ai.google.dev/docs
- **YouTube Data API**: https://developers.google.com/youtube/v3
- **Twilio API**: https://www.twilio.com/docs
- **Piston API**: https://github.com/engineer-man/piston
- **LiveKit**: https://docs.livekit.io
- **MediaPipe**: https://google.github.io/mediapipe/

### 12.4 Glossary

| Term | Definition |
|------|------------|
| **Roadmap** | Personalized learning path for a specific course |
| **Concept** | Individual lesson or topic within a chapter |
| **Chapter** | Section of a course containing related concepts |
| **Streak** | Consecutive days with completed learning tasks |
| **Assessment** | Quiz or test to evaluate understanding |
| **Lab** | Saved code playground project |
| **Study Session** | Focus monitoring session in the AI Study Room |
| **Mentor Slot** | Time slot a mentor makes available for booking |
| **Booking** | Scheduled mentorship session between learner and mentor |
| **Certificate ID** | Unique SHA-256 hash identifying a completion certificate |

### 12.5 Contact & Support

- **Product Owner**: [Contact Information]
- **Lead Developer**: [Contact Information]
- **Technical Support**: support@skillmeter.ai
- **Sales Inquiries**: sales@skillmeter.ai
- **GitHub Repository**: https://github.com/didaco97/SkillMeterAi

---

**Document Version:** 1.0  
**Last Updated:** January 31, 2026  
**Status:** Active Development  
**Next Review:** March 2026

---

*This Product Requirements Document is a living document and will be updated as SkillMeter AI evolves.*
