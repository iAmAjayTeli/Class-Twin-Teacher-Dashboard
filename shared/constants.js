// ClassTwin Shared Constants
export const ROUND_DURATION = 120; // 2 minutes per round
export const QUESTION_TIME_LIMIT = 30; // 30 seconds per question
export const MAX_ROUNDS = 8;
export const AI_INSIGHT_INTERVAL = 2; // run AI every 2 rounds

export const RISK_LEVELS = {
  ON_TRACK: 'ON_TRACK',
  AT_RISK: 'AT_RISK',
  HIGH_RISK: 'HIGH_RISK'
};

export const RISK_COLORS = {
  ON_TRACK: '#4ae176',
  AT_RISK: '#ffb95f',
  HIGH_RISK: '#ffb4ab'
};

export const COMPREHENSION_THRESHOLDS = {
  LOW: 40,
  MEDIUM: 70,
  HIGH: 85
};

export const SESSION_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  ENDED: 'ended'
};

export const SOCKET_EVENTS = {
  // Student → Server
  JOIN: 'join',
  ANSWER: 'answer',
  
  // Server → Teacher
  TWIN_UPDATE: 'twin_update',
  STUDENT_JOINED: 'student_joined',
  ROUND_START: 'round_start',
  ROUND_END: 'round_end',
  AI_INSIGHT: 'ai_insight',
  
  // Server → Student
  QUESTION: 'question',
  FEEDBACK: 'feedback',
  
  // Teacher → Server
  CREATE_SESSION: 'create_session',
  START_SESSION: 'start_session',
  NEXT_ROUND: 'next_round',
  END_SESSION: 'end_session'
};

export const SAMPLE_QUESTIONS = [
  {
    text: "What is the base case in recursion?",
    options: ["The recursive call itself", "The condition where the function stops calling itself", "The return value of the function", "None of the above"],
    correct: 1,
    concept: "Recursion Base Case"
  },
  {
    text: "What happens if a recursive function has no base case?",
    options: ["It returns undefined", "It causes a stack overflow", "It runs once and stops", "It optimizes automatically"],
    correct: 1,
    concept: "Infinite Recursion"
  },
  {
    text: "What is the time complexity of binary search?",
    options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    correct: 1,
    concept: "Binary Search"
  },
  {
    text: "Which data structure uses FIFO?",
    options: ["Stack", "Queue", "Tree", "Graph"],
    correct: 1,
    concept: "Queue Data Structure"
  },
  {
    text: "What does 'DRY' stand for in programming?",
    options: ["Do Repeat Yourself", "Don't Repeat Yourself", "Data Retrieval Yield", "Dynamic Resource Yielding"],
    correct: 1,
    concept: "DRY Principle"
  },
  {
    text: "What is a closure in JavaScript?",
    options: ["A function that closes the browser", "A function with access to its outer scope", "A terminated function", "A private class method"],
    correct: 1,
    concept: "Closures"
  },
  {
    text: "What is memoization?",
    options: ["Memorizing code syntax", "Caching computed results for reuse", "A type of recursion", "Converting memory to disk"],
    correct: 1,
    concept: "Memoization"
  },
  {
    text: "Which sorting algorithm has the best average case?",
    options: ["Bubble Sort", "Selection Sort", "Quick Sort", "Insertion Sort"],
    correct: 2,
    concept: "Sorting Algorithms"
  }
];
