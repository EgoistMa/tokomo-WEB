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
  uuid: string;
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
  uuid?: string;
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

// Site Config Types
export interface ImageConfig {
  url: string;
  title: string;
  link?: string;
}

export interface CustomerServiceConfig {
  img: string;
  qq: string;
}

export interface SiteConfig {
  id: number;
  carousel: ImageConfig[];
  bannerL: ImageConfig;
  bannerR: ImageConfig;
  customerService: CustomerServiceConfig;
  updated_at: string;
}

export interface SiteConfigResponse {
  config: SiteConfig;
}

export interface UpdateSiteConfigRequest {
  carousel?: ImageConfig[];
  bannerL?: ImageConfig;
  bannerR?: ImageConfig;
  customerService?: CustomerServiceConfig;
}

// Purchase Types
export interface PurchaseGameRequest {
  gameId: number;
}

export interface PurchaseGameResponse {
  message: string;
  purchaseId: number;
}

export interface PurchasedGame extends Game {
  purchase_id: number;
  purchase_date: string;
}

export interface PurchasedGamesResponse {
  games: PurchasedGame[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Redeem Types
export interface RedeemCodeUseRequest {
  code: string;
}

export interface RedeemCodeUseResponse {
  message: string;
  pointsAdded: number;
  totalPoints: number;
}

export interface RedeemCode {
  id: number;
  code: string;
  points: number;
  used: number;
  used_at: string | null;
  used_by: number | null;
  created_at: string;
}

export interface RedeemCodesResponse {
  codes: RedeemCode[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateRedeemCodeRequest {
  code?: string;
  points: number;
}

export interface CreateRedeemCodeResponse {
  message: string;
  code: string;
  points: number;
}

export interface BatchCreateRedeemCodeRequest {
  count: number;
  points: number;
  prefix?: string;
}

export interface BatchCreateRedeemCodeResponse {
  message: string;
  created: number;
  failed: number;
  codes: string[];
}

export interface UpdateRedeemCodeRequest {
  points?: number;
  used?: number;
}

export interface ImportRedeemCodesResponse {
  message: string;
  summary: {
    total: number;
    created: number;
    failed: number;
  };
  failedRecords: Array<{
    code: string;
    points: number;
    reason: string;
  }>;
}

// Group Types
export interface Group {
  id: number;
  name: string;
  invite_code: string;
  reward_points: number;
  note: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface GroupMember {
  id: number;
  user_id: number;
  username: string;
  joined_at: string;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
}

export interface GroupsResponse {
  groups: Group[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateGroupRequest {
  name: string;
  inviteCode?: string;
  rewardPoints: number;
  note?: string;
}

export interface CreateGroupResponse {
  message: string;
  groupId: number;
  inviteCode: string;
}

export interface UpdateGroupRequest {
  name?: string;
  inviteCode?: string;
  rewardPoints?: number;
  note?: string;
}

export interface JoinGroupRequest {
  inviteCode: string;
}

export interface JoinGroupResponse {
  message: string;
  groupName: string;
  pointsAdded: number;
  totalPoints: number;
}

export interface GroupStatistics {
  group: Group;
  total_codes_used: number;
  total_points_rewarded: number;
  codes: Array<{
    id: number;
    code: string;
    points: number;
    used_at: string;
    user_id: number;
    username: string;
  }>;
}

// User Admin Types
export interface UserDetail {
  id: number;
  username: string;
  created_at: string;
  is_active: number;
  is_admin: number;
  last_login_at: string | null;
  points: number;
  vip_expire_date: string | null;
  security_question: string;
}

export interface UserDetailResponse {
  user: UserDetail;
}

export interface UpdateUserRequest {
  points?: number;
  vipExpireDate?: string | null;
  isAdmin?: boolean;
  isActive?: boolean;
}

export interface AdminResetPasswordRequest {
  newPassword: string;
}

// VIP Code Types
export interface VipCode {
  id: number;
  code: string;
  days: number;
  used: number;
  used_at: string | null;
  used_by: number | null;
  group_id: number | null;
  created_at: string;
}

export interface VipCodesResponse {
  codes: VipCode[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UseVipCodeRequest {
  code: string;
}

export interface UseVipCodeResponse {
  message: string;
  daysAdded: number;
  vipExpireDate: string;
}

export interface CreateVipCodeRequest {
  code?: string;
  days: number;
  groupId?: number;
}

export interface CreateVipCodeResponse {
  message: string;
  code: string;
  days: number;
}

export interface BatchCreateVipCodeRequest {
  count: number;
  days: number;
  prefix?: string;
  groupId?: number;
}

export interface BatchCreateVipCodeResponse {
  message: string;
  created: number;
  failed: number;
  codes: string[];
}

export interface UpdateVipCodeRequest {
  days?: number;
  used?: number;
}

export interface ImportVipCodesResponse {
  message: string;
  imported: number;
  failed: number;
  errors: string[];
}
