interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
  ageGroup: number;
  gender: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const CREATOR_ACCESS_TOKEN_KEY = "creatorAccessToken";
const CREATOR_REFRESH_TOKEN_KEY = "creatorRefreshToken";

export const tokenStorage = {
  getAccessToken: () => sessionStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => sessionStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (tokens: TokenResponse) => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  clearTokens: () => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export const creatorTokenStorage = {
  getAccessToken: () => sessionStorage.getItem(CREATOR_ACCESS_TOKEN_KEY),
  getRefreshToken: () => sessionStorage.getItem(CREATOR_REFRESH_TOKEN_KEY),
  setTokens: (tokens: TokenResponse) => {
    sessionStorage.setItem(CREATOR_ACCESS_TOKEN_KEY, tokens.accessToken);
    sessionStorage.setItem(CREATOR_REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  clearTokens: () => {
    sessionStorage.removeItem(CREATOR_ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(CREATOR_REFRESH_TOKEN_KEY);
  },
};

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

export const authService = {
  getGoogleLoginUrl(): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  async googleLogin(code: string): Promise<void> {
    const res = await fetch("/api/users/oauth2/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error("Google 로그인에 실패했습니다.");
    const tokens: TokenResponse = await res.json();
    tokenStorage.setTokens(tokens);
  },
  async signup(data: SignupRequest): Promise<string> {
    const res = await fetch("/api/users/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.text().catch(() => "회원가입에 실패했습니다.");
      throw new Error(error || "회원가입에 실패했습니다.");
    }
    return res.json();
  },

  async login(email: string, password: string): Promise<void> {
    const res = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    const tokens: TokenResponse = await res.json();
    tokenStorage.setTokens(tokens);
  },

  async refresh(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) throw new Error("리프레시 토큰이 없습니다.");
    const res = await fetch("/api/users/refresh", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: refreshToken,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "토큰 재발급에 실패했습니다.");
    }
    const tokens: TokenResponse = await res.json();
    tokenStorage.setTokens(tokens);
  },

  async logout(): Promise<void> {
    await fetch("/api/users/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
      },
    });
    tokenStorage.clearTokens();
  },

  async sendVerificationCode(email: string): Promise<void> {
    const res = await fetch("/api/users/email/verification/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "인증 코드 발송에 실패했습니다.");
    }
  },

  async verifyEmailCode(email: string, code: string): Promise<void> {
    const res = await fetch("/api/users/email/verification/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "인증 코드가 올바르지 않습니다.");
    }
  },

  async checkEmailDuplicate(email: string): Promise<boolean> {
    const res = await fetch(`/api/users/email/check?email=${encodeURIComponent(email)}`);
    if (res.status === 200) return true;   // 사용 가능
    if (res.status === 409) return false;  // 중복
    throw new Error("이메일 중복 확인에 실패했습니다.");
  },

  async checkNicknameDuplicate(nickname: string): Promise<boolean> {
    const res = await fetch(`/api/users/nickname/check?nickname=${encodeURIComponent(nickname)}`);
    if (res.status === 200) return true;   // 사용 가능
    if (res.status === 409) return false;  // 중복
    throw new Error("닉네임 중복 확인에 실패했습니다.");
  },

  async creatorLogin(email: string, password: string): Promise<void> {
    const res = await fetch("/api/creators/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    const tokens: TokenResponse = await res.json();
    creatorTokenStorage.setTokens(tokens);
  },

  async creatorSignup(data: {
    email: string;
    password: string;
    nickname: string;
    phoneNumber: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }): Promise<void> {
    const res = await fetch("/api/creators/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.text().catch(() => "가입에 실패했습니다.");
      throw new Error(error || "가입에 실패했습니다.");
    }
  },

  async checkCreatorEmailDuplicate(email: string): Promise<boolean> {
    const res = await fetch(`/api/creators/email/check?email=${encodeURIComponent(email)}`);
    if (res.status === 200) return true;
    if (res.status === 409) return false;
    throw new Error("이메일 중복 확인에 실패했습니다.");
  },

  async checkCreatorNicknameDuplicate(nickname: string): Promise<boolean> {
    const res = await fetch(`/api/creators/nickname/check?nickname=${encodeURIComponent(nickname)}`);
    if (res.status === 200) return true;
    if (res.status === 409) return false;
    throw new Error("닉네임 중복 확인에 실패했습니다.");
  },

  async creatorRefresh(): Promise<void> {
    const refreshToken = creatorTokenStorage.getRefreshToken();
    if (!refreshToken) throw new Error("리프레시 토큰이 없습니다.");
    const res = await fetch("/api/creators/refresh", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: refreshToken,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "토큰 재발급에 실패했습니다.");
    }
    const tokens: TokenResponse = await res.json();
    creatorTokenStorage.setTokens(tokens);
  },

  async creatorLogout(): Promise<void> {
    await fetch("/api/creators/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creatorTokenStorage.getAccessToken()}`,
      },
    });
    creatorTokenStorage.clearTokens();
  },
};

