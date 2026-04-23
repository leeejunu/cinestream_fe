import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { authService, tokenStorage } from "../services/authService";
import { useUser } from "../contexts/UserContext";
import { toast } from "sonner";

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useUser();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get("code");
    if (!code) {
      toast.error("Google 로그인에 실패했습니다.");
      navigate("/login");
      return;
    }

    // 같은 code 재처리 방지 (remount 대비)
    const processedKey = `oauth_code_${code}`;
    if (sessionStorage.getItem(processedKey)) {
      navigate("/main");
      return;
    }
    sessionStorage.setItem(processedKey, "1");

    // 기존 stale 토큰 제거 (SESSION_EXPIRED 인터셉터 간섭 방지)
    tokenStorage.clearTokens();

    authService
      .googleLogin(code)
      .then(() => refreshUser())
      .then(() => {
        toast.success("Google 로그인 성공!");
        navigate("/main");
      })
      .catch(() => {
        sessionStorage.removeItem(processedKey);
        toast.error("Google 로그인에 실패했습니다.");
        navigate("/login");
      });
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div className="text-white text-lg">Google 로그인 처리 중...</div>
    </div>
  );
}
