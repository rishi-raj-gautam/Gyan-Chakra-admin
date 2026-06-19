export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'blocked';

export interface User {
  id: string;
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  role: UserRole;
  status: UserStatus;
  walletBalance: number;
  lifetimeEarnings: number;
  totalContestsPlayed: number;
  totalContestsWon: number;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
}

export type QuizStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'completed';

export interface Option {
  text: string;
  index: number;
}

export interface DailyQuiz {
  _id: string;
  id?: string;
  title: string;
  question: string;
  options: Option[];
  correctAnswerIndex: number;
  rewardAmount: number;
  startTime: string;
  endTime: string;
  status: QuizStatus;
  participantsCount: number;
  correctAnswersCount: number;
  createdBy?: string | User;
  winnerId?: string | User;
  createdAt: string;
  updatedAt: string;
}

export type ChallengeStatus = 'draft' | 'open' | 'closed' | 'completed';

export interface ChallengeQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  points: number;
}

export interface MegaChallenge {
  _id: string;
  title: string;
  description: string;
  bannerImage?: string;
  rewardAmount: number;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  questions: ChallengeQuestion[];
  totalParticipants: number;
  shortlistedCount: number;
  createdBy?: string | User;
  createdAt: string;
  updatedAt: string;
}

export type ContestType = 'daily_quiz' | 'mega_challenge';
export type WinnerStatus = 'pending' | 'announced' | 'paid' | 'disqualified';

export interface Winner {
  _id: string;
  contestType: ContestType;
  contestId: string;
  userId: User;
  rewardAmount: number;
  winnerStatus: WinnerStatus;
  announcementDate?: string;
  remarks?: string;
  drawId: string;
  selectedBy: 'auto' | 'admin';
  selectedByAdminId?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  performedBy: {
    _id: string;
    name: string;
    email?: string;
  };
  targetId?: string;
  targetType?: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  userId: string | User;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  description: string;
  status: string;
  referenceId?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  userId?: string;
  isRead: boolean;
  type?: string;
  createdAt: string;
}

export interface Settings {
  [key: string]: any;
}

// API Payloads
export interface LoginCredentials {
  mobile: string;
  password?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordPayload {
  mobile: string;
}

export interface ResetPasswordPayload {
  mobile: string;
  otp: string;
  newPassword?: string;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    users?: T[];
    quizzes?: T[];
    challenges?: T[];
    logs?: T[];
    notifications?: T[];
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
}
