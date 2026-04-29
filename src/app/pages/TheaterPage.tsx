import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useUser } from "../contexts/UserContext";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { StreamPlayer } from "../components/streaming/StreamPlayer";
import { ChatPanel } from "../components/streaming/ChatPanel";
import { StateBanner } from "../components/streaming/StateBanner";
import { StreamErrorScreen } from "../components/streaming/StreamErrorScreen";
import {
  mapStreamingError,
  streamingService,
  type ChatMessage,
  type StateMessage,
  type StreamingSessionErrorCode,
  type StreamingSessionResponse,
  type StreamState,
} from "../services/streamingService";
import {
  connectStreamStomp,
  type StreamStomp,
  type WsConnectionState,
} from "../lib/streamingStomp";

const FALLBACK_INITIAL_STATE: StreamState = "LOBBY_OPEN";

const computeInitialState = (startTime: string, endTime: string): StreamState => {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (now < start - 10 * 60 * 1000) return "CLOSED";
  if (now < start - 60 * 1000) return "LOBBY_OPEN";
  if (now < start) return "STARTING_SOON";
  if (now < end - 60 * 1000) return "STARTED";
  if (now < end) return "ENDING_SOON";
  if (now < end + 10 * 60 * 1000) return "ENDED";
  return "FORCE_EXIT";
};

export function TheaterPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { scheduleId: scheduleIdParam } = useParams<{ scheduleId: string }>();
  const scheduleId = useMemo(() => Number(scheduleIdParam), [scheduleIdParam]);

  const [session, setSession] = useState<StreamingSessionResponse | null>(null);
  const [errorCode, setErrorCode] = useState<StreamingSessionErrorCode | null>(null);
  const [state, setState] = useState<StreamState>(FALLBACK_INITIAL_STATE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ownMessageIds, setOwnMessageIds] = useState<Set<string>>(new Set());
  const [viewerCount, setViewerCount] = useState(0);
  const [wsState, setWsState] = useState<WsConnectionState>("connecting");
  const [retryNonce, setRetryNonce] = useState(0);
  const [chatWidth, setChatWidth] = useState(384); // 기본 w-96 = 384px

  const stompRef = useRef<StreamStomp | null>(null);
  const recentSentRef = useRef<{ content: string; at: number }[]>([]);
  const isDraggingRef = useRef(false);

  const handleDragStart = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    e.preventDefault();

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = window.innerWidth - ev.clientX;
      setChatWidth(Math.min(Math.max(newWidth, 280), 640));
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleFatalPlayerError = useCallback(
    (kind: "AUTH" | "WINDOW_CLOSED" | "NETWORK" | "MEDIA" | "OTHER") => {
      if (kind === "AUTH") setErrorCode("SESSION_EXPIRED");
      else if (kind === "WINDOW_CLOSED") setErrorCode("WINDOW_CLOSED");
      else toast.error("재생 중 문제가 발생했어요. 다시 시도해 주세요.");
    },
    [],
  );

  useEffect(() => {
    if (!Number.isFinite(scheduleId) || scheduleId <= 0) {
      setErrorCode("SCHEDULE_NOT_FOUND");
      return;
    }
    let cancelled = false;
    setErrorCode(null);
    setSession(null);
    setMessages([]);
    setViewerCount(0);
    setWsState("connecting");

    streamingService
      .createSession(scheduleId)
      .then((res) => {
        if (cancelled) return;
        setSession(res);
        setState(computeInitialState(res.schedule.startTime, res.schedule.endTime));
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorCode(mapStreamingError(err));
      });

    return () => {
      cancelled = true;
    };
  }, [scheduleId, retryNonce]);

  useEffect(() => {
    if (!session) return;

    const stomp = connectStreamStomp({
      wsEndpoint: session.wsEndpoint,
      sessionToken: session.sessionToken,
      scheduleId,
      handlers: {
        onConnectionStateChange: setWsState,
        onState: (msg: StateMessage) => setState(msg.state),
        onChat: (msg) => {
          const now = Date.now();
          const idx = recentSentRef.current.findIndex(
            (s) => s.content === msg.content && now - s.at < 5000,
          );
          if (idx !== -1) {
            recentSentRef.current.splice(idx, 1);
            setOwnMessageIds((prev) => new Set([...prev, msg.messageId]));
          }
          setMessages((prev) => (prev.length > 200 ? [...prev.slice(-150), msg] : [...prev, msg]));
        },
        onViewers: (msg) => setViewerCount(msg.count),
        onWsError: (msg) => {
          if (msg.code === "CHAT_RATE_LIMITED") toast.warning("너무 자주 보내고 있어요.");
          else if (msg.code === "CHAT_MESSAGE_TOO_LONG") toast.warning("메시지가 너무 길어요.");
        },
        onKick: (msg) => {
          if (msg.reason === "DUPLICATE_LOGIN") {
            toast.error("다른 곳에서 입장하여 현재 세션이 종료되었어요.");
          } else {
            toast.info("관람 시간이 종료되어 자동 퇴장됩니다.");
          }
          navigate("/mypage");
        },
        onConnectFailed: (code) => {
          if (code === "NO_ENTITLEMENT") setErrorCode("NO_ENTITLEMENT");
          else if (code === "WINDOW_CLOSED") setErrorCode("WINDOW_CLOSED");
          else if (code === "SESSION_MISMATCH") setErrorCode("SESSION_MISMATCH");
          else if (code === "INVALID_TOKEN") setErrorCode("INVALID_TOKEN");
          else if (code === "SESSION_EXPIRED") setErrorCode("SESSION_EXPIRED");
          else setErrorCode("UNKNOWN");
        },
      },
    });
    stompRef.current = stomp;

    return () => {
      stomp.disconnect();
      stompRef.current = null;
    };
  }, [session, scheduleId, navigate]);

  // FORCE_EXIT 도달 시 자동 메인 이동 (백엔드 kick 직전 상태 메시지 반영)
  useEffect(() => {
    if (state !== "FORCE_EXIT") return;
    const id = setTimeout(() => navigate("/main"), 3000);
    return () => clearTimeout(id);
  }, [state, navigate]);

  const handleExit = () => {
    if (confirm("상영관을 퇴장하시겠습니까?")) {
      navigate("/main");
    }
  };

  const handleRetry = () => {
    setRetryNonce((n) => n + 1);
  };

  const handleSend = useCallback((content: string) => {
    recentSentRef.current.push({ content, at: Date.now() });
    stompRef.current?.sendChat(content);
  }, []);

  if (errorCode) {
    return <StreamErrorScreen code={errorCode} onRetry={handleRetry} />;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white/70">
        스트리밍을 준비하고 있어요...
      </div>
    );
  }

  const showPlayer = state === "STARTED" || state === "ENDING_SOON";

  return (
    <div className="h-screen overflow-hidden bg-black text-white flex flex-col lg:flex-row">
      <div className="absolute top-4 left-4 z-50">
        <Button variant="ghost" className="text-white hover:bg-white/20" onClick={handleExit}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          퇴장
        </Button>
      </div>

      <div className="relative flex-1 min-h-[40vh] lg:h-full bg-black">
        {showPlayer ? (
          <StreamPlayer
            manifestUrl={session.manifestUrl}
            scheduleStartTime={session.schedule.startTime}
            enabled={showPlayer}
            controlsEnabled={showPlayer}
            onFatalError={handleFatalPlayerError}
          />
        ) : (
          <StateBanner
            state={state}
            startTime={session.schedule.startTime}
            endTime={session.schedule.endTime}
            title={session.schedule.title}
            imageUrl={session.schedule.imageUrl}
          />
        )}
      </div>

      <div
        className="hidden lg:flex items-center justify-center w-1 bg-white/10 hover:bg-white/30 cursor-col-resize shrink-0 transition-colors"
        onMouseDown={handleDragStart}
      >
        <div className="w-0.5 h-8 bg-white/40 rounded-full" />
      </div>

      <aside className="w-full h-[60vh] lg:h-full shrink-0" style={{ width: chatWidth }}>
        <ChatPanel
          messages={messages}
          ownMessageIds={ownMessageIds}
          viewerCount={viewerCount}
          wsState={wsState}
          onSend={handleSend}
          selfNickname={user?.nickname ?? null}
        />
      </aside>
    </div>
  );
}
