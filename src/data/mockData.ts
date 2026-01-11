import { Course, User, Roadmap, Assessment, UserProgress, Notification, Task, AssessmentResult } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    role: 'student',
    createdAt: new Date('2024-01-15'),
    onboardingCompleted: true,
  },
  {
    id: 'admin-1',
    name: 'Sarah Admin',
    email: 'admin@skillmeter.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    role: 'admin',
    createdAt: new Date('2023-12-01'),
    onboardingCompleted: true,
  },
];

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: 'course-react',
    title: 'Master React Development',
    description: 'Learn React from the ground up. Build modern web applications with hooks, state management, and best practices.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
    difficulty: 'intermediate',
    estimatedHours: 24,
    tags: ['React', 'JavaScript', 'Frontend', 'Web Development'],
    chapters: [
      {
        id: 'ch-1',
        title: 'Getting Started with React',
        description: 'Introduction to React and setting up your development environment',
        order: 1,
        concepts: [
          {
            id: 'c-1-1',
            title: 'What is React?',
            description: 'Understanding React and its core philosophy',
            duration: 15,
            videoUrl: 'https://www.youtube.com/embed/Tn6-PIqc4UM',
            notes: '# What is React?\n\nReact is a JavaScript library for building user interfaces. It was developed by Facebook and is now maintained by Meta.\n\n## Key Features\n- **Component-Based**: Build encapsulated components that manage their own state\n- **Declarative**: Design simple views for each state in your application\n- **Learn Once, Write Anywhere**: Develop new features without rewriting existing code\n\n## Why React?\n1. Virtual DOM for efficient updates\n2. Reusable components\n3. Strong community and ecosystem\n4. Backed by Meta',
            completed: false,
            type: 'video',
          },
          {
            id: 'c-1-2',
            title: 'Setting Up Your Environment',
            description: 'Installing Node.js, npm, and creating your first React app',
            duration: 20,
            videoUrl: 'https://www.youtube.com/embed/tiLWCNFzThE',
            notes: '# Setting Up Your React Environment\n\n## Prerequisites\n- Node.js (v16 or higher)\n- npm or yarn\n- Code editor (VS Code recommended)\n\n## Create React App\n```bash\nnpx create-react-app my-app\ncd my-app\nnpm start\n```\n\n## Using Vite (Recommended)\n```bash\nnpm create vite@latest my-app -- --template react\ncd my-app\nnpm install\nnpm run dev\n```',
            completed: false,
            type: 'video',
          },
          {
            id: 'c-1-3',
            title: 'JSX Fundamentals',
            description: 'Learn the syntax that powers React components',
            duration: 25,
            videoUrl: 'https://www.youtube.com/embed/9GtB5G2xGTY',
            notes: '# JSX Fundamentals\n\nJSX is a syntax extension for JavaScript that looks similar to HTML.\n\n## Basic Syntax\n```jsx\nconst element = <h1>Hello, World!</h1>;\n```\n\n## Expressions in JSX\n```jsx\nconst name = "React";\nconst element = <h1>Hello, {name}!</h1>;\n```\n\n## Key Rules\n- Must return a single parent element\n- Use className instead of class\n- Self-closing tags must end with />',
            completed: false,
            type: 'video',
          },
        ],
      },
      {
        id: 'ch-2',
        title: 'Components & Props',
        description: 'Building reusable UI components and passing data with props',
        order: 2,
        concepts: [
          {
            id: 'c-2-1',
            title: 'Functional Components',
            description: 'Creating and using functional components',
            duration: 20,
            videoUrl: 'https://www.youtube.com/embed/Cla1WwguArA',
            notes: '# Functional Components\n\nFunctional components are the modern way to write React components.\n\n## Basic Component\n```jsx\nfunction Welcome() {\n  return <h1>Hello, World!</h1>;\n}\n```\n\n## Arrow Function Syntax\n```jsx\nconst Welcome = () => {\n  return <h1>Hello, World!</h1>;\n};\n```',
            completed: false,
            type: 'video',
          },
          {
            id: 'c-2-2',
            title: 'Understanding Props',
            description: 'Passing data to components using props',
            duration: 25,
            videoUrl: 'https://www.youtube.com/embed/PHaECbrKgs0',
            notes: '# Props in React\n\nProps (properties) allow you to pass data from parent to child components.\n\n## Using Props\n```jsx\nfunction Welcome({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}\n\n// Usage\n<Welcome name="Alex" />\n```',
            completed: false,
            type: 'video',
          },
          {
            id: 'c-2-3',
            title: 'Component Composition',
            description: 'Building complex UIs by composing components',
            duration: 30,
            videoUrl: 'https://www.youtube.com/embed/UxLvdu0Bfmc',
            notes: '# Component Composition\n\nComposition lets you build complex UIs from smaller pieces.\n\n## Children Prop\n```jsx\nfunction Card({ children }) {\n  return <div className="card">{children}</div>;\n}\n\n<Card>\n  <h2>Title</h2>\n  <p>Content here</p>\n</Card>\n```',
            completed: false,
            type: 'video',
          },
        ],
      },
      {
        id: 'ch-3',
        title: 'State & Hooks',
        description: 'Managing component state with React hooks',
        order: 3,
        concepts: [
          {
            id: 'c-3-1',
            title: 'useState Hook',
            description: 'Managing local component state',
            duration: 30,
            videoUrl: 'https://www.youtube.com/embed/O6P86uwfdR0',
            notes: '# useState Hook\n\nuseState allows you to add state to functional components.\n\n## Basic Usage\n```jsx\nimport { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <button onClick={() => setCount(count + 1)}>\n      Count: {count}\n    </button>\n  );\n}\n```',
            completed: false,
            type: 'video',
          },
          {
            id: 'c-3-2',
            title: 'useEffect Hook',
            description: 'Handling side effects in components',
            duration: 35,
            videoUrl: 'https://www.youtube.com/embed/0ZJgIjIuY7U',
            notes: '# useEffect Hook\n\nuseEffect handles side effects like data fetching, subscriptions, or DOM manipulation.\n\n## Basic Usage\n```jsx\nimport { useEffect, useState } from "react";\n\nfunction DataFetcher() {\n  const [data, setData] = useState(null);\n  \n  useEffect(() => {\n    fetch("/api/data")\n      .then(res => res.json())\n      .then(setData);\n  }, []); // Empty array = run once\n  \n  return <div>{data}</div>;\n}\n```',
            completed: false,
            type: 'video',
          },
        ],
      },
    ],
  },
  {
    id: 'course-python-dsa',
    title: 'Python Data Structures & Algorithms',
    description: 'Master DSA concepts with Python. Prepare for coding interviews with hands-on practice.',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=250&fit=crop',
    difficulty: 'intermediate',
    estimatedHours: 32,
    tags: ['Python', 'DSA', 'Algorithms', 'Coding Interview'],
    chapters: [
      {
        id: 'dsa-ch-1',
        title: 'Arrays & Strings',
        description: 'Fundamental operations on arrays and string manipulation',
        order: 1,
        concepts: [
          {
            id: 'dsa-1-1',
            title: 'Array Operations',
            description: 'Understanding arrays and common operations',
            duration: 25,
            videoUrl: 'https://www.youtube.com/embed/pmN9ExDf3yQ',
            notes: '# Array Operations in Python\n\n## Lists in Python\nPython uses lists as dynamic arrays.\n\n```python\narr = [1, 2, 3, 4, 5]\n\n# Access: O(1)\nprint(arr[0])  # 1\n\n# Append: O(1) amortized\narr.append(6)\n\n# Insert: O(n)\narr.insert(0, 0)\n\n# Remove: O(n)\narr.remove(3)\n```',
            completed: false,
            type: 'video',
          },
          {
            id: 'dsa-1-2',
            title: 'Two Pointer Technique',
            description: 'Solving array problems efficiently with two pointers',
            duration: 30,
            videoUrl: 'https://www.youtube.com/embed/On03HWe2tZM',
            notes: '# Two Pointer Technique\n\nA powerful technique for solving array problems.\n\n```python\ndef two_sum_sorted(arr, target):\n    left, right = 0, len(arr) - 1\n    \n    while left < right:\n        current_sum = arr[left] + arr[right]\n        if current_sum == target:\n            return [left, right]\n        elif current_sum < target:\n            left += 1\n        else:\n            right -= 1\n    \n    return [-1, -1]\n```',
            completed: false,
            type: 'video',
          },
        ],
      },
      {
        id: 'dsa-ch-2',
        title: 'Linked Lists',
        description: 'Understanding and implementing linked list data structures',
        order: 2,
        concepts: [
          {
            id: 'dsa-2-1',
            title: 'Singly Linked List',
            description: 'Implementing a singly linked list from scratch',
            duration: 35,
            videoUrl: 'https://www.youtube.com/embed/R9PTBwOzceo',
            notes: '# Singly Linked List\n\n```python\nclass Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\nclass LinkedList:\n    def __init__(self):\n        self.head = None\n    \n    def append(self, val):\n        if not self.head:\n            self.head = Node(val)\n            return\n        current = self.head\n        while current.next:\n            current = current.next\n        current.next = Node(val)\n```',
            completed: false,
            type: 'video',
          },
        ],
      },
    ],
  },
  {
    id: 'course-web-basics',
    title: 'Web Development Fundamentals',
    description: 'Start your web development journey with HTML, CSS, and JavaScript basics.',
    thumbnail: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=250&fit=crop',
    difficulty: 'beginner',
    estimatedHours: 16,
    tags: ['HTML', 'CSS', 'JavaScript', 'Web Development'],
    chapters: [
      {
        id: 'web-ch-1',
        title: 'HTML Essentials',
        description: 'Learn the building blocks of web pages',
        order: 1,
        concepts: [
          {
            id: 'web-1-1',
            title: 'HTML Document Structure',
            description: 'Understanding the basic structure of an HTML document',
            duration: 20,
            videoUrl: 'https://www.youtube.com/embed/qz0aGYrrlhU',
            notes: '# HTML Document Structure\n\n```html\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello World</h1>\n</body>\n</html>\n```',
            completed: false,
            type: 'video',
          },
        ],
      },
    ],
  },
];

// Mock Assessments
export const mockAssessments: Assessment[] = [
  {
    id: 'assessment-1',
    conceptId: 'c-1-1',
    timeLimit: 10,
    questions: [
      {
        id: 'q-1',
        type: 'mcq',
        question: 'What is React primarily used for?',
        options: [
          'Backend development',
          'Building user interfaces',
          'Database management',
          'Server configuration',
        ],
        correctAnswer: 'Building user interfaces',
        explanation: 'React is a JavaScript library specifically designed for building user interfaces, particularly single-page applications.',
        conceptId: 'c-1-1',
      },
      {
        id: 'q-2',
        type: 'mcq',
        question: 'Who developed React?',
        options: ['Google', 'Microsoft', 'Facebook (Meta)', 'Amazon'],
        correctAnswer: 'Facebook (Meta)',
        explanation: 'React was developed by Facebook (now Meta) and is currently maintained by them along with the open-source community.',
        conceptId: 'c-1-1',
      },
      {
        id: 'q-3',
        type: 'mcq',
        question: 'What is the Virtual DOM?',
        options: [
          'A browser feature',
          'A lightweight copy of the actual DOM',
          'A type of database',
          'A CSS framework',
        ],
        correctAnswer: 'A lightweight copy of the actual DOM',
        explanation: 'The Virtual DOM is a programming concept where a virtual representation of the UI is kept in memory and synced with the real DOM.',
        conceptId: 'c-1-1',
      },
    ],
  },
  {
    id: 'assessment-2',
    conceptId: 'c-1-3',
    timeLimit: 10,
    questions: [
      {
        id: 'q-4',
        type: 'mcq',
        question: 'What does JSX stand for?',
        options: [
          'JavaScript XML',
          'Java Syntax Extension',
          'JavaScript Extended',
          'JSON XML',
        ],
        correctAnswer: 'JavaScript XML',
        explanation: 'JSX stands for JavaScript XML. It allows you to write HTML-like syntax in JavaScript.',
        conceptId: 'c-1-3',
      },
      {
        id: 'q-5',
        type: 'mcq',
        question: 'In JSX, how do you add a CSS class to an element?',
        options: ['class="name"', 'className="name"', 'cssClass="name"', 'style="name"'],
        correctAnswer: 'className="name"',
        explanation: 'In JSX, you use className instead of class because class is a reserved keyword in JavaScript.',
        conceptId: 'c-1-3',
      },
    ],
  },
];

// Mock Roadmaps
export const mockRoadmaps: Roadmap[] = [
  {
    id: 'roadmap-1',
    userId: 'user-1',
    course: mockCourses[0],
    progress: 15,
    currentChapter: 0,
    currentConcept: 0,
    startedAt: new Date('2024-01-20'),
    lastAccessedAt: new Date(),
  },
];

// Mock User Progress
export const mockUserProgress: UserProgress = {
  userId: 'user-1',
  totalCoursesEnrolled: 2,
  totalCoursesCompleted: 0,
  totalMinutesLearned: 180,
  averageScore: 78,
  currentStreak: 5,
  longestStreak: 12,
  weakConcepts: ['useEffect Hook', 'Component Composition'],
  dailyProgress: [
    { date: '2024-01-08', minutesLearned: 45, conceptsCompleted: 2, assessmentsTaken: 1 },
    { date: '2024-01-09', minutesLearned: 30, conceptsCompleted: 1, assessmentsTaken: 0 },
    { date: '2024-01-10', minutesLearned: 60, conceptsCompleted: 3, assessmentsTaken: 2 },
    { date: '2024-01-11', minutesLearned: 25, conceptsCompleted: 1, assessmentsTaken: 1 },
    { date: '2024-01-12', minutesLearned: 0, conceptsCompleted: 0, assessmentsTaken: 0 },
    { date: '2024-01-13', minutesLearned: 40, conceptsCompleted: 2, assessmentsTaken: 1 },
    { date: '2024-01-14', minutesLearned: 55, conceptsCompleted: 2, assessmentsTaken: 1 },
  ],
};

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'reminder',
    title: 'Time to learn!',
    message: "You haven't studied today. Complete a lesson to maintain your streak!",
    read: false,
    createdAt: new Date(),
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'achievement',
    title: '5-Day Streak! 🔥',
    message: "You've been learning for 5 days in a row. Keep it up!",
    read: false,
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    type: 'missed',
    title: 'Missed Assessment',
    message: 'You skipped the assessment for "JSX Fundamentals". Complete it to reinforce your learning.',
    read: true,
    createdAt: new Date(Date.now() - 172800000),
  },
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    type: 'video',
    title: 'Watch: What is React?',
    conceptId: 'c-1-1',
    courseId: 'course-react',
    completed: false,
  },
  {
    id: 'task-2',
    type: 'notes',
    title: 'Read: React Introduction Notes',
    conceptId: 'c-1-1',
    courseId: 'course-react',
    completed: false,
  },
  {
    id: 'task-3',
    type: 'assessment',
    title: 'Quiz: React Basics',
    conceptId: 'c-1-1',
    courseId: 'course-react',
    completed: false,
  },
];

// Available skills/languages for onboarding
export const availableLanguages = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Scala'
];

export const availableTools = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Django', 'Flask',
  'Spring Boot', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker',
  'Kubernetes', 'AWS', 'Git', 'Linux', 'VS Code'
];

export const learningGoals = [
  { id: 'react', label: 'Learn React', description: 'Build modern web apps' },
  { id: 'python-dsa', label: 'Master DSA with Python', description: 'Ace coding interviews' },
  { id: 'web-basics', label: 'Web Development Basics', description: 'Start your dev journey' },
  { id: 'fullstack', label: 'Become Full Stack Developer', description: 'Frontend + Backend' },
  { id: 'mobile', label: 'Mobile App Development', description: 'iOS & Android apps' },
  { id: 'ml', label: 'Machine Learning', description: 'AI & Data Science' },
];
