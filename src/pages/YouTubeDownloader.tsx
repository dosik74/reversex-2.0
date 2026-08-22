import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, ArrowLeft, Loader2, AlertCircle, CheckCircle, Play, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

interface VideoInfo {
  title: string;
  duration: number;
  thumbnail: string;
  uploader: string;
  uploadDate: string;
  description: string;
}

interface DownloadProgress {
  status: "idle" | "fetching" | "downloading" | "completed" | "error";
  message: string;
  progress: number;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Русские переводы
const RU = {
  title: "Загрузчик YouTube видео",
  subtitle: "Скачивайте видео в 4K качестве быстро и безопасно",
  back: "На главную",
  urlLabel: "Ссылка на видео YouTube",
  urlPlaceholder: "https://www.youtube.com/watch?v=...",
  loadVideo: "Загрузить видео",
  loading: "Загрузка...",
  selectQuality: "Выберите качество видео",
  bestAvailable: "Лучшее качество",
  download: "Скачать видео",
  downloading: "Скачивается...",
  completed: "Загрузка завершена!",
  fileName: "Название файла",
  fileSize: "Размер файла",
  channel: "Канал",
  duration: "Длительность",
  published: "Опубликовано",
  description: "Описание",
  downloadAgain: "Скачать ещё",
  downloadAnother: "Скачать другое видео",
  pasteLink: "Вставьте ссылку на видео YouTube",
  enterUrl: "Введите ссылку на видео YouTube выше и нажмите кнопку загрузки",
  fast: "⚡ Быстро",
  fastDesc: "Скачивайте видео с оптимальной скоростью",
  highQuality: "🎬 Высокое качество",
  highQualityDesc: "Видео в 4K и лучшем доступном качестве",
  easyToUse: "🎨 Просто в использовании",
  easyToUseDesc: "Простой и красивый интерфейс для быстрой загрузки",
  errorLoadingVideo: "Ошибка при загрузке информации о видео",
  errorDownloading: "Ошибка при загрузке видео",
  emptyUrl: "Пожалуйста, введите ссылку на YouTube",
};

const YouTubeDownloader = () => {
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState("best");
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    status: "idle",
    message: "",
    progress: 0,
  });

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const qualityOptions = [
    { value: "best", label: "🎬 Лучшее качество", description: "Лучший доступный формат" },
    { value: "4k", label: "4K", description: "3840x2160 (4K)" },
    { value: "1440p", label: "2K", description: "2560x1440" },
    { value: "1080p", label: "1080p", description: "Высокое качество" },
    { value: "720p", label: "720p", description: "Стандартное качество" },
    { value: "480p", label: "480p", description: "Мобильное качество" },
  ];

  const handleLoadVideo = async () => {
    if (!url.trim()) {
      toast.error(RU.emptyUrl);
      return;
    }

    setDownloadProgress({ status: "fetching", message: "Загружаю информацию о видео...", progress: 0 });

    try {
      const response = await axios.post(`${API_BASE_URL}/api/video-info`, { url: url.trim() });
      setVideoInfo(response.data);
      setDownloadProgress({ status: "idle", message: "", progress: 0 });
      toast.success("Видео загружено!");
    } catch (error) {
      console.error("Error loading video:", error);
      toast.error(RU.errorLoadingVideo);
      setDownloadProgress({
        status: "error",
        message: `${RU.errorLoadingVideo}: ${error instanceof Error ? error.message : "Unknown error"}`,
        progress: 0,
      });
    }
  };

  const handleDownload = async () => {
    if (!videoInfo) return;

    setDownloadProgress({ status: "downloading", message: "Инициализация загрузки...", progress: 0 });

    try {
      // Отправляем запрос и получаем файл напрямую
      const response = await axios.post(
        `${API_BASE_URL}/api/download`,
        { url: url.trim(), quality: selectedQuality },
        {
          responseType: "blob",
          timeout: 600000, // 10 минут timeout для больших файлов
          onDownloadProgress: (progressEvent) => {
            const total = progressEvent.total;
            const current = progressEvent.loaded;
            
            if (total && total > 0) {
              const percentage = Math.round((current / total) * 100);
              const sizeLoaded = (current / (1024 * 1024)).toFixed(1);
              const sizeTotal = (total / (1024 * 1024)).toFixed(1);
              
              setDownloadProgress({
                status: "downloading",
                message: `Загружаю видео... ${sizeLoaded} МБ из ${sizeTotal} МБ`,
                progress: percentage,
              });
            } else {
              // Если размер файла неизвестен, показываем загруженное количество
              const sizeLoaded = (current / (1024 * 1024)).toFixed(1);
              setDownloadProgress({
                status: "downloading",
                message: `Загружаю видео... ${sizeLoaded} МБ`,
                progress: Math.min(95, 5 + (current % 100000) / 100000 * 90),
              });
            }
          },
        }
      );

      // Извлекаем имя файла из заголовков
      const contentDisposition = response.headers["content-disposition"];
      let fileName = "video.mp4";
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch[1]) {
          try {
            fileName = decodeURIComponent(fileNameMatch[1]);
          } catch {
            fileName = fileNameMatch[1];
          }
        }
      }

      // Создаём blob и скачиваем файл
      const blob = new Blob([response.data], { type: "application/octet-stream" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      
      // Очищаем объекты после загрузки
      setTimeout(() => {
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);

      setDownloadProgress({
        status: "completed",
        message: `"${videoInfo.title}" загружено успешно!`,
        progress: 100,
        fileName: fileName,
      });

      toast.success("Видео успешно загружено!");
    } catch (error) {
      console.error("Error downloading:", error);
      
      let errorMsg = RU.errorDownloading;
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          errorMsg = "Неверная ссылка YouTube";
        } else if (error.response?.status === 404) {
          errorMsg = "Видео не найдено";
        } else if (error.response?.status === 500) {
          const details = (error.response?.data as any)?.error || "Unknown error";
          errorMsg = `Ошибка: ${details}`;
        } else if (error.code === "ECONNABORTED") {
          errorMsg = "Время ожидания истекло. Попробуйте ещё раз.";
        }
      }
      
      toast.error(errorMsg);
      setDownloadProgress({
        status: "error",
        message: errorMsg,
        progress: 0,
      });
    }
  };

  const handleReset = () => {
    setUrl("");
    setVideoInfo(null);
    setSelectedQuality("best");
    setDownloadProgress({ status: "idle", message: "", progress: 0 });
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Фоновый градиент */}
      <div className="fixed inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-primary/50 to-accent/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-gradient-to-tr from-primary/30 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Навигация */}
        <div className="border-b border-border bg-background/80 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link to="/">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {RU.back}
              </Button>
            </Link>
          </div>
        </div>

        {/* Основной контент */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {RU.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{RU.subtitle}</p>
          </div>

          {/* Основная форма / Результат */}
          {!videoInfo ? (
            <Card className="max-w-2xl mx-auto bg-card border-border p-8 mb-12 card-glow">
              <div className="space-y-6">
                <div>
                  <label className="block text-foreground font-semibold mb-3">{RU.urlLabel}</label>
                  <Input
                    type="text"
                    placeholder={RU.urlPlaceholder}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleLoadVideo()}
                    className="bg-secondary border-border text-foreground placeholder-muted-foreground h-12"
                    disabled={downloadProgress.status !== "idle"}
                  />
                </div>

                <Button
                  onClick={handleLoadVideo}
                  disabled={downloadProgress.status !== "idle" || !url.trim()}
                  className="w-full h-12 bg-gradient-primary hover:shadow-glow text-primary-foreground font-semibold text-lg transition-all"
                >
                  {downloadProgress.status === "fetching" ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {RU.loading}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      {RU.loadVideo}
                    </>
                  )}
                </Button>

                {downloadProgress.status === "error" && (
                  <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-destructive text-sm">{downloadProgress.message}</p>
                  </div>
                )}
              </div>

              {/* Информационные блоки */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-border">
                {[
                  { icon: "⚡", title: RU.fast, desc: RU.fastDesc },
                  { icon: "🎬", title: RU.highQuality, desc: RU.highQualityDesc },
                  { icon: "🎨", title: RU.easyToUse, desc: RU.easyToUseDesc },
                ].map((item) => (
                  <div key={item.title} className="text-center p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-all">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Информация о видео */}
              <Card className="bg-card border-border overflow-hidden card-glow">
                <div className="flex flex-col md:flex-row gap-8 p-8">
                  {/* Миниатюра */}
                  <div className="flex-shrink-0">
                    <img
                      src={videoInfo.thumbnail}
                      alt={videoInfo.title}
                      className="w-full md:w-72 h-auto rounded-lg object-cover shadow-lg"
                    />
                  </div>

                  {/* Информация */}
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-foreground mb-6">{videoInfo.title}</h2>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center text-card-foreground/80">
                        <User className="w-5 h-5 mr-3 text-primary" />
                        <span className="font-medium">{videoInfo.uploader}</span>
                      </div>
                      <div className="flex items-center text-card-foreground/80">
                        <Clock className="w-5 h-5 mr-3 text-primary" />
                        <span>{formatDuration(videoInfo.duration)}</span>
                      </div>
                      {videoInfo.uploadDate && (
                        <div className="flex items-center text-card-foreground/80">
                          <span className="text-primary mr-3">📅</span>
                          <span>{videoInfo.uploadDate}</span>
                        </div>
                      )}
                    </div>

                    {videoInfo.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{RU.description}</h3>
                        <p className="text-card-foreground/70 text-sm line-clamp-4">{videoInfo.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Выбор качества и загрузка */}
              <Card className="bg-card border-border p-8 card-glow">
                <h3 className="text-2xl font-bold text-foreground mb-8">{RU.selectQuality}</h3>

                {downloadProgress.status === "completed" ? (
                  <div className="bg-primary/10 border border-primary/50 rounded-lg p-6 mb-8">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="w-8 h-8 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-foreground font-semibold text-lg">{downloadProgress.message}</p>
                        {downloadProgress.fileName && (
                          <p className="text-muted-foreground text-sm mt-2">📁 {downloadProgress.fileName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {downloadProgress.status === "downloading" && (
                  <div className="mb-8 bg-secondary/50 rounded-lg p-6 border border-border">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-foreground font-semibold">{downloadProgress.message}</span>
                      <span className="text-primary font-bold text-lg">{downloadProgress.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-primary h-full transition-all duration-300 shadow-glow"
                        style={{ width: `${downloadProgress.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {downloadProgress.status !== "downloading" && downloadProgress.status !== "completed" && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                      {qualityOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedQuality(option.value)}
                          className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                            selectedQuality === option.value
                              ? "border-primary bg-primary/20 text-foreground shadow-glow"
                              : "border-border bg-secondary text-muted-foreground hover:border-primary/50 hover:bg-secondary/80"
                          }`}
                        >
                          <div>{option.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                        </button>
                      ))}
                    </div>

                    <Button
                      onClick={handleDownload}
                      disabled={downloadProgress.status === "downloading"}
                      className="w-full h-12 bg-gradient-primary hover:shadow-glow text-primary-foreground font-semibold text-lg transition-all"
                    >
                      {downloadProgress.status === "downloading" ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {RU.downloading}
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 mr-2" />
                          {RU.download}
                        </>
                      )}
                    </Button>
                  </>
                )}

                {downloadProgress.status === "error" && (
                  <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-6 flex gap-4 mb-8">
                    <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                    <p className="text-destructive text-sm">{downloadProgress.message}</p>
                  </div>
                )}

                {downloadProgress.status === "completed" && (
                  <div className="flex gap-4 flex-col md:flex-row">
                    <Button
                      onClick={handleReset}
                      className="flex-1 h-12 bg-gradient-primary hover:shadow-glow text-primary-foreground font-semibold transition-all"
                    >
                      {RU.downloadAgain}
                    </Button>
                    <Button
                      onClick={() => {
                        handleReset();
                        setUrl("");
                      }}
                      variant="outline"
                      className="flex-1 h-12 border-border text-foreground hover:bg-secondary"
                    >
                      {RU.downloadAnother}
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubeDownloader;
