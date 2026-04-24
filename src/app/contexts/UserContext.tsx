import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { userService, UserInfo } from "../services/userService";
import { tokenStorage } from "../services/authService";

interface UserContextType {
  user: UserInfo | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateCookies: (newBalance: number) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await userService.getMe();
      setUser(data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  const updateCookies = (newBalance: number) => {
    if (user) {
      setUser({ ...user, cookieBalance: newBalance });
    }
  };

  useEffect(() => {
    // OAuth 콜백 페이지에서는 기존 토큰으로 fetch하지 않음
    // (googleLogin이 기존 세션을 무효화하면서 in-flight 요청이 SESSION_EXPIRED로 돌아와
    //  navigate 후 pathname이 바뀐 뒤 인터셉터가 강제 로그아웃시키는 race condition 방지)
    if (!window.location.pathname.startsWith("/oauth2")) {
      refreshUser();
    }
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, updateCookies, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
