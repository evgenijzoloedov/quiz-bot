export interface Admin {
  telegramId: number;
  name: string;
  role: string;
  permissions: string[];
}

export interface Name {
  _id: string;
  name: string;
  pdfFilePath?: string;
  pdfFile?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Quiz {
  _id: string;
  name: string;
  questions: Question[];
  successVideo: string | null;
  isActive: boolean;
  questionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  _id: string;
  questionText: string;
  type: 'single' | 'multiple';
  image?: string | null;
  answers: Answer[];
  correctAnswerIds: string[];
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProgress {
  _id: string;
  telegramUserId: number;
  selectedName: string;
  quizId?: string | null;
  completedAt: string;
  answersCorrect: boolean;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  score: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: PaginationInfo;
  error?: string;
  code?: string;
  statusCode?: number;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  admin: Admin;
}

export interface AnalyticsOverview {
  totalUsers: number;
  totalNames: number;
  totalQuestions: number;
  totalCompletions: number;
  completionRate: number;
  averageTimeSpent: number;
  namesByPopularity: Array<{
    name: string;
    completions: number;
  }>;
}

export interface NameAnalytics {
  name: string;
  totalAttempts: number;
  completions: number;
  completionRate: number;
  averageTimeSpent: number;
  questionStats: Array<{
    questionId: string;
    questionText: string;
    correctCount: number;
    incorrectCount: number;
    accuracy: number;
  }>;
}

export interface FileInfo {
  filename: string;
  url: string;
  size: number;
  type: 'image' | 'pdf';
  uploadedAt: string;
}

export interface FailImage {
  _id: string;
  filename: string;
  imageUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

