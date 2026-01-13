# 🎓 SkillMeter AI - Complete Tech Stack Documentation

<div align="center">
  <img src="public/logo.png" alt="SkillMeter Logo" width="120"/>
  
  **AI-Powered Personalized Learning Platform**
  
  [![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF?logo=vite)](https://vitejs.dev/)
  [![Django](https://img.shields.io/badge/Django-5.2.10-092E20?logo=django)](https://djangoproject.com/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
  [![Google Gemini](https://img.shields.io/badge/Gemini_AI-3_Flash_Preview-4285F4?logo=google)](https://ai.google.dev/)
</div>

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture](#-architecture)
3. [Frontend Tech Stack](#-frontend-tech-stack)
4. [Backend Tech Stack](#-backend-tech-stack)
5. [Database Schema](#-database-schema)
6. [AI & External APIs](#-ai--external-apis)
7. [Features & Components](#-features--components)
8. [Project Structure](#-project-structure)
9. [Setup & Installation](#-setup--installation)

---

## 🎯 Project Overview

SkillMeter AI is a comprehensive, AI-powered learning management system that creates personalized learning roadmaps for users. It leverages Google's Gemini AI to generate course structures and integrates with YouTube Data API for real video content.

**Key Highlights:**
- 🤖 AI-generated personalized learning roadmaps
- 📹 Real YouTube video integration for each concept
- 📊 Comprehensive progress tracking with streaks
- 🏆 Course completion certificates
- 💻 Integrated code playground (Monaco Editor)
- 📝 AI-generated notes and quizzes
- 🎨 Beautiful Neo-Brutalist UI design

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React + Vite)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │ Components  │  │     Contexts            │  │
│  │ (14 views)  │  │ (55+ UI)    │  │ Auth | Learning         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST (JWT Auth)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Django REST Framework)                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Views     │  │ Serializers │  │     Services            │  │
│  │ (API Views) │  │ (DRF)       │  │ AI | YouTube | PDF      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ SQLite3  │   │ Gemini   │   │ YouTube  │
        │ Database │   │ AI API   │   │ Data API │
        └──────────┘   └──────────┘   └──────────┘
```

---

## 💻 Frontend Tech Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI library for building component-based interfaces |
| **Vite** | 5.4.19 | Next-generation frontend build tool with HMR |
| **React Router DOM** | 6.30.1 | Client-side routing and navigation |

### Styling & Design

| Technology | Version | Purpose |
|------------|---------|---------|
| **TailwindCSS** | 3.4.17 | Utility-first CSS framework for rapid styling |
| **tailwind-merge** | 2.6.0 | Merges Tailwind CSS classes without conflicts |
| **tailwindcss-animate** | 1.0.7 | Animation utilities for Tailwind |
| **@tailwindcss/typography** | 0.5.16 | Beautiful typographic defaults for markdown |
| **class-variance-authority** | 0.7.1 | Creating variant-based component styles |
| **clsx** | 2.1.1 | Conditional class name construction |

### UI Component Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **Radix UI** | Various | Unstyled, accessible UI primitives (55+ components) |
| **Lucide React** | 0.462.0 | Beautiful, consistent icon library (500+ icons) |
| **shadcn/ui** | N/A | Re-usable components built on Radix + Tailwind |

#### Complete Radix UI Primitives Used:

| Component | Purpose |
|-----------|---------|
| `@radix-ui/react-accordion` | Expandable content panels |
| `@radix-ui/react-alert-dialog` | Modal confirmation dialogs |
| `@radix-ui/react-avatar` | User profile images |
| `@radix-ui/react-checkbox` | Form checkboxes |
| `@radix-ui/react-dialog` | Modal dialogs |
| `@radix-ui/react-dropdown-menu` | Contextual menus |
| `@radix-ui/react-label` | Accessible form labels |
| `@radix-ui/react-popover` | Floating content panels |
| `@radix-ui/react-progress` | Progress indicators |
| `@radix-ui/react-scroll-area` | Custom scrollbars |
| `@radix-ui/react-select` | Custom select dropdowns |
| `@radix-ui/react-separator` | Visual dividers |
| `@radix-ui/react-slider` | Range input sliders |
| `@radix-ui/react-slot` | Component composition |
| `@radix-ui/react-switch` | Toggle switches |
| `@radix-ui/react-tabs` | Tabbed interfaces |
| `@radix-ui/react-toast` | Notification toasts |
| `@radix-ui/react-tooltip` | Hover tooltips |
| ...and 10+ more | Various UI needs |

### Animation & Motion

| Library | Version | Purpose |
|---------|---------|---------|
| **Framer Motion** | 12.26.2 | Production-ready motion library for React |
| **embla-carousel-react** | 8.6.0 | Lightweight carousel/slider component |

**Used For:**
- Page transitions
- Sky-drop login/signup animations
- Loading state animations
- Micro-interactions
- Carousel/tip cycling during roadmap generation

### Data Visualization

| Library | Version | Purpose |
|---------|---------|---------|
| **Recharts** | 2.15.4 | React charting library built on D3 |

**Used For:**
- Progress charts on dashboard
- Activity heatmaps
- Learning statistics visualization

### Code Editor & Terminal

| Library | Version | Purpose |
|---------|---------|---------|
| **@monaco-editor/react** | 4.7.0 | VS Code's editor for React |
| **monaco-editor** | 0.55.1 | Core Monaco editor engine |
| **xterm** | 5.3.0 | Terminal emulator for web |
| **xterm-addon-fit** | 0.8.0 | Auto-resize terminal to container |

**Used For:**
- **Practice Lab**: Full code playground with multi-file support
- Syntax highlighting for 50+ languages
- Terminal output simulation

### Utilities & Helpers

| Library | Version | Purpose |
|---------|---------|---------|
| **axios** | 1.13.2 | HTTP client for API requests |
| **date-fns** | 3.6.0 | Modern date utility library |
| **lodash** | 4.17.21 | Utility functions |
| **zod** | 3.25.76 | TypeScript-first schema validation |
| **react-hook-form** | 7.61.1 | Performant form handling |
| **@hookform/resolvers** | 3.10.0 | Validation resolvers for react-hook-form |
| **react-markdown** | 10.1.0 | Markdown renderer for notes |
| **html2canvas** | 1.4.1 | Screenshot capture for certificates |

### State Management

| Library | Version | Purpose |
|---------|---------|---------|
| **@tanstack/react-query** | 5.83.0 | Server state management and caching |
| **React Context** | Built-in | Client state management |

**Contexts Implemented:**
- `AuthContext.jsx` - Authentication state, JWT tokens, user data
- `LearningContext.jsx` - Current roadmap, progress, concept selection

### Theming

| Library | Version | Purpose |
|---------|---------|---------|
| **next-themes** | 0.3.0 | Theme switching (light/dark mode) |

### Additional UI Components

| Library | Version | Purpose |
|---------|---------|---------|
| **cmdk** | 1.1.1 | Command palette component |
| **vaul** | 0.9.9 | Drawer component |
| **sonner** | 1.7.4 | Toast notifications |
| **react-day-picker** | 8.10.1 | Date picker component |
| **input-otp** | 1.4.2 | OTP input fields |
| **react-resizable-panels** | 2.1.9 | Resizable panel layouts |

### Dev Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| **ESLint** | 9.32.0 | JavaScript linting |
| **PostCSS** | 8.5.6 | CSS transformations |
| **Autoprefixer** | 10.4.21 | CSS vendor prefixing |
| **@vitejs/plugin-react-swc** | 3.11.0 | SWC-powered React plugin for Vite |

---

## 🐍 Backend Tech Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Django** | 5.2.10 | High-level Python web framework |
| **Django REST Framework** | Latest | Powerful toolkit for building Web APIs |
| **Python** | 3.10+ | Backend programming language |

### Authentication & Security

| Library | Purpose |
|---------|---------|
| **djangorestframework-simplejwt** | JWT token-based authentication |
| **Token Blacklist** | Logout and token revocation |
| **CORS Headers** | Cross-Origin Resource Sharing |

**JWT Configuration:**
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

### Installed Django Apps

```python
INSTALLED_APPS = [
    'django.contrib.admin',       # Admin interface
    'django.contrib.auth',        # User authentication
    'django.contrib.contenttypes',# Content types framework
    'django.contrib.sessions',    # Session management
    'django.contrib.messages',    # Messaging framework
    'django.contrib.staticfiles', # Static file serving
    'rest_framework',             # Django REST Framework
    'rest_framework_simplejwt',   # JWT authentication
    'rest_framework_simplejwt.token_blacklist',  # Token blacklisting
    'corsheaders',                # CORS handling
    'api',                        # Main application
]
```

### PDF Generation

| Library | Purpose |
|---------|---------|
| **ReportLab** | PDF document generation for certificates |

**Certificate Features:**
- Custom logo and Rocketboy illustration
- Dynamic user name and course title
- Unique certificate ID (SHA-256 hash)
- Signature lines and completion date

### Environment Management

| Library | Purpose |
|---------|---------|
| **python-dotenv** | Environment variable management |

---

## 🗄 Database Schema

### Database Engine

| Technology | Purpose |
|------------|---------|
| **SQLite3** | Lightweight, file-based relational database |

**Database File:** `backend/db.sqlite3`

### Models (12 Total)

#### 1. LearnerProfile
```python
class LearnerProfile(models.Model):
    user = OneToOneField(User)      # Django User link
    skill_level = CharField()        # beginner/intermediate/advanced
    learning_goals = JSONField()     # List of goal IDs
    daily_study_time = IntegerField()# Minutes per day
    onboarding_completed = BooleanField()
```

#### 2. Course
```python
class Course(models.Model):
    title = CharField(max_length=200)
    description = TextField()
    thumbnail = URLField()           # YouTube thumbnail
    difficulty = CharField()         # beginner/intermediate/advanced
    estimated_hours = IntegerField()
    tags = JSONField()               # e.g., ['React', 'JavaScript']
```

#### 3. Chapter
```python
class Chapter(models.Model):
    course = ForeignKey(Course)
    title = CharField(max_length=200)
    description = TextField()
    order = IntegerField()           # Ordering within course
```

#### 4. Concept
```python
class Concept(models.Model):
    chapter = ForeignKey(Chapter)
    title = CharField(max_length=200)
    duration = IntegerField()        # Minutes
    video_url = URLField()           # YouTube embed URL
    notes = TextField()              # Markdown content
    content_type = CharField()       # video/article/exercise
```

#### 5. Roadmap
```python
class Roadmap(models.Model):
    user = ForeignKey(User)
    course = ForeignKey(Course)
    progress = IntegerField()        # 0-100 percentage
    current_chapter = IntegerField()
    current_concept = IntegerField()
    # unique_together = ['user', 'course']
```

#### 6. ConceptProgress
```python
class ConceptProgress(models.Model):
    user = ForeignKey(User)
    concept = ForeignKey(Concept)
    completed = BooleanField()
    completed_at = DateTimeField()
```

#### 7. Assessment
```python
class Assessment(models.Model):
    concept = ForeignKey(Concept)
    questions = JSONField()          # List of question objects
    time_limit = IntegerField()      # Minutes
```

#### 8. AssessmentResult
```python
class AssessmentResult(models.Model):
    user = ForeignKey(User)
    assessment = ForeignKey(Assessment)
    score = IntegerField()           # 0-100 percentage
    answers = JSONField()            # User's answers
```

#### 9. DailyTask
```python
class DailyTask(models.Model):
    user = ForeignKey(User)
    concept = ForeignKey(Concept)
    task_type = CharField()          # video/notes/assessment
    title = CharField()
    scheduled_date = DateField()
    completed = BooleanField()
```

#### 10. Notification
```python
class Notification(models.Model):
    user = ForeignKey(User)
    notification_type = CharField()  # reminder/achievement/missed/system
    title = CharField()
    message = TextField()
    read = BooleanField()
```

#### 11. UserProgress
```python
class UserProgress(models.Model):
    user = OneToOneField(User)
    total_minutes_learned = IntegerField()
    total_concepts_completed = IntegerField()
    total_assessments_taken = IntegerField()
    average_score = IntegerField()
    current_streak = IntegerField()
    longest_streak = IntegerField()
    last_activity_date = DateField()
```

#### 12. Lab
```python
class Lab(models.Model):
    user = ForeignKey(User)
    name = CharField(max_length=200)
    language = CharField()           # javascript/python/etc
    files = JSONField()              # [{name, language, content}, ...]
```

### Entity Relationship Diagram

```
User (Django Built-in)
  ├── LearnerProfile (1:1)
  ├── UserProgress (1:1)
  ├── Roadmap (1:N) ──────────┐
  ├── ConceptProgress (1:N)   │
  ├── AssessmentResult (1:N)  │
  ├── DailyTask (1:N)         │
  ├── Notification (1:N)      │
  └── Lab (1:N)               │
                              │
Course ◄──────────────────────┘
  └── Chapter (1:N)
        └── Concept (1:N)
              ├── Assessment (1:N)
              │     └── AssessmentResult (N:1 User)
              ├── ConceptProgress (N:1 User)
              └── DailyTask (N:1 User)
```

---

## 🤖 AI & External APIs

### Google Gemini AI

| Property | Value |
|----------|-------|
| **Model** | `gemini-3-flash-preview` |
| **Library** | `google-generativeai` |
| **Purpose** | Course content generation |

**Usage in Services:**

```python
# ContentDiscoveryService - Roadmap Generation
model = genai.GenerativeModel('gemini-3-flash-preview')
response = model.generate_content(prompt)
```

**AI-Generated Content:**
1. **Course Structure** - Chapters and concepts
2. **Concept Notes** - Markdown study materials
3. **Quiz Questions** - Multiple choice assessments

**Prompt Engineering:**
- Structured JSON output format
- Skill-level appropriate difficulty
- Duration estimation per concept

### YouTube Data API v3

| Property | Value |
|----------|-------|
| **Endpoint** | `https://www.googleapis.com/youtube/v3/search` |
| **Purpose** | Video search and thumbnail retrieval |

**Usage in Services:**

```python
class YouTubeService:
    @staticmethod
    def search_video(query):
        # Returns: {video_url, thumbnail}
        response = requests.get(url, params={
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'maxResults': 1,
            'key': API_KEY
        })
```

**Integration Flow:**
1. Gemini generates concept titles
2. YouTubeService searches for matching videos
3. Video URLs and thumbnails are stored in Concept model

---

## 🎨 Features & Components

### Pages (14 Total)

| Page | File | Key Features |
|------|------|--------------|
| **Landing** | `Landing.jsx` | Hero section, feature cards, CTA |
| **Login** | `Login.jsx` | JWT auth, sky-drop animation |
| **Signup** | `Signup.jsx` | User registration, form validation |
| **Onboarding** | `Onboarding.jsx` | Skill level, goals, loading tips |
| **Dashboard** | `Dashboard.jsx` | Stats, tasks, notifications |
| **Roadmap** | `Roadmap.jsx` | Course outline, progress, certificate |
| **Learn** | `Learn.jsx` | Video player, notes, quizzes |
| **Progress** | `Progress.jsx` | Activity heatmap, statistics |
| **PracticeLab** | `PracticeLab.jsx` | Monaco editor, file tabs |
| **Notifications** | `Notifications.jsx` | Notification center |
| **Profile** | `Profile.jsx` | User settings |
| **Settings** | `Settings.jsx` | App preferences |
| **NotFound** | `NotFound.jsx` | 404 page |
| **Index** | `Index.jsx` | Route redirect |

### Custom Components

| Component | Purpose |
|-----------|---------|
| **Certificate** | Downloadable completion certificate |
| **DashboardLayout** | Sidebar navigation wrapper |
| **PublicLayout** | Header/footer for public pages |
| **NavLink** | Navigation link component |

### UI Components (55+)

All built on Radix UI primitives with Tailwind styling:

| Category | Components |
|----------|------------|
| **Forms** | Input, Textarea, Select, Checkbox, Radio, Switch, Slider |
| **Feedback** | Toast, Alert, Progress, Skeleton |
| **Navigation** | Tabs, Accordion, Navigation Menu, Breadcrumb |
| **Overlays** | Dialog, Sheet, Popover, Tooltip, Dropdown Menu |
| **Data Display** | Card, Table, Avatar, Badge |
| **Layout** | Separator, Scroll Area, Resizable Panels |
| **Custom** | Particles, Retro Grid, Letter Swap, Twitter Cards |

---

## 📁 Project Structure

```
SkillMeterAi/
├── 📁 public/                    # Static assets
│   ├── logo.png                  # SkillMeter logo
│   ├── logowithname.png          # Logo with text
│   └── Rocketboy.png             # Mascot illustration
│
├── 📁 src/                       # Frontend source
│   ├── 📁 components/
│   │   ├── 📁 ui/                # 55 shadcn/ui components
│   │   ├── 📁 layout/            # DashboardLayout, PublicLayout
│   │   ├── 📁 dashboard/         # Dashboard-specific components
│   │   ├── 📁 ide/               # Code editor components
│   │   └── Certificate.jsx       # Certificate generator
│   │
│   ├── 📁 pages/                 # 14 page components
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Roadmap.jsx
│   │   ├── Learn.jsx
│   │   ├── Progress.jsx
│   │   └── ...
│   │
│   ├── 📁 contexts/              # React Context providers
│   │   ├── AuthContext.jsx       # Authentication state
│   │   └── LearningContext.jsx   # Learning progress state
│   │
│   ├── 📁 hooks/                 # Custom React hooks
│   │   └── use-toast.js
│   │
│   ├── 📁 lib/                   # Utilities
│   │   └── utils.js              # cn() helper function
│   │
│   ├── 📁 data/                  # Static data
│   │   ├── constants.js          # App constants
│   │   └── mockData.jsx          # Mock data for dev
│   │
│   ├── App.jsx                   # Root component
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles + Tailwind
│
├── 📁 backend/                   # Django backend
│   ├── 📁 backend/               # Django project settings
│   │   ├── settings.py           # Configuration
│   │   ├── urls.py               # Root URL routing
│   │   └── wsgi.py               # WSGI entry
│   │
│   ├── 📁 api/                   # Main Django app
│   │   ├── models.py             # 12 database models
│   │   ├── views.py              # API views
│   │   ├── serializers.py        # DRF serializers
│   │   ├── urls.py               # API routes
│   │   ├── services.py           # AI & YouTube services
│   │   ├── admin.py              # Admin configuration
│   │   └── 📁 static/images/     # Certificate images
│   │
│   ├── db.sqlite3                # SQLite database
│   ├── manage.py                 # Django CLI
│   └── .env                      # Environment variables
│
├── package.json                  # NPM dependencies
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # Tailwind configuration
├── postcss.config.js             # PostCSS configuration
└── README.md                     # This file
```

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm or yarn

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install Python dependencies
pip install django djangorestframework djangorestframework-simplejwt
pip install django-cors-headers python-dotenv
pip install google-generativeai requests reportlab

# Setup database
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver 0.0.0.0:8000
```

### Environment Variables

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 📊 Technology Summary

| Category | Technologies |
|----------|-------------|
| **Frontend Framework** | React 18, Vite 5 |
| **Styling** | TailwindCSS 3, CSS-in-JS |
| **UI Library** | Radix UI, shadcn/ui, Lucide Icons |
| **Animation** | Framer Motion, Embla Carousel |
| **State Management** | React Context, TanStack Query |
| **Code Editor** | Monaco Editor, Xterm.js |
| **Charts** | Recharts |
| **Backend Framework** | Django 5, Django REST Framework |
| **Database** | SQLite3 |
| **Authentication** | JWT (SimpleJWT) |
| **AI Integration** | Google Gemini AI (gemini-3-flash-preview) |
| **Video API** | YouTube Data API v3 |
| **PDF Generation** | ReportLab |
| **Screenshot** | html2canvas |

---

<div align="center">
  <p>Built with ❤️ using cutting-edge AI technology</p>
  <p><strong>SkillMeter AI</strong> - Learn Smarter, Not Harder</p>
</div>
