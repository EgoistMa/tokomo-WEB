export interface LoginRequest {
  username: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

export interface RegisterRequest {
  username: string;
  password?: string;
  securityQuestion: string;
  securityAnswer: string;
  inviteCode?: string;
}

export interface RegisterResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

export interface GetSecurityQuestionRequest {
  username: string;
}

export interface GetSecurityQuestionResponse {
  question: string;
}

export interface ResetPasswordRequest {
  username: string;
  securityAnswer: string;
  newPassword?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Game Types
export interface Game {
  id: number;
  download_url: string;
  extract_password?: string | null;
  game_name: string;
  game_type?: string | null;
  note?: string | null;
  password?: string | null;
  created_at: string;
}

export interface GameListResponse {
  games: Game[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateGameRequest {
  gameName: string;
  downloadUrl: string;
  gameType?: string;
  extractPassword?: string;
  password?: string;
  note?: string;
}

export interface UpdateGameRequest {
  gameName?: string;
  downloadUrl?: string;
  gameType?: string;
  extractPassword?: string;
  password?: string;
  note?: string;
}
