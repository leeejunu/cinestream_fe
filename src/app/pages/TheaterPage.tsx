import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Play, Pause, Volume2, VolumeX, Maximize, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "../contexts/UserContext";

export function TheaterPage() {
  const navigate = useNavigate();
  const { scheduleId } = useParams();
  const { refreshUser } = useUser();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(5880); // 98분 = 5880초

  useEffect(() => {
    // 입장 시 쿠키 차감 (이후 백엔드 연동)
    toast.success("상영관에 입장했습니다. 쿠키 5개가 차감되었습니다.");
    refreshUser(); // 전역 상태 갱신

    // 상영 시작 10분 전 입장 가능 체크
    const now = new Date();
    console.log("입장 시간:", now);

    return () => {
      toast.info("상영관을 퇴장했습니다.");
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleExit = () => {
    if (confirm("상영관을 퇴장하시겠습니까?")) {
      navigate("/main");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Theater Controls */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={handleExit}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          퇴장
        </Button>
      </div>

      {/* Video Player */}
      <div className="relative h-screen flex items-center justify-center">
        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-white text-2xl mb-2">밤의 속삭임</h2>
            <p className="text-slate-400">영화 스트리밍 화면</p>
          </div>
        </div>

        {/* Video Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="bg-slate-700 h-1 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-white text-sm mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8" />
                )}
              </Button>

              <Button
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </Button>

              <div className="text-white">
                <span className="font-semibold">상영 ID:</span> {scheduleId}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => toast.info("전체화면 기능")}
              >
                <Maximize className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Session Warning */}
      <div className="absolute top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm">
        ⚠️ 상영 종료 10분 후 자동 퇴장됩니다
      </div>
    </div>
  );
}
