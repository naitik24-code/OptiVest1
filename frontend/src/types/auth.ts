export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserRegisterPayload {
  email: string;
  password: string;
}

export interface UserLoginPayload {
  email: string;
  password: string;
}
