import { useState, useEffect } from "react";
import { calendarService } from "../../services/calendarService";

export function useCalendarSync() {
  const [calendarPath, setCalendarPath] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCalendarToken = async () => {
    try {
      setIsLoading(true);
      const data = await calendarService.getCalendarToken();
      setCalendarPath(data.path);
    } catch (err: any) {
      setError(err.message || "Gagal memuat link kalender");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarToken();
  }, []);

  const handleRegenerateToken = async () => {
    if (
      !window.confirm(
        "Buat link kalender baru? Kalender yang sudah terhubung dengan link lama tidak akan menampilkan tugas lagi sampai Anda memasukkan link baru."
      )
    ) {
      return;
    }

    try {
      setIsRegenerating(true);
      const data = await calendarService.regenerateCalendarToken();
      setCalendarPath(data.path);
      setIsCopied(false);
    } catch (err: any) {
      setError(err.message || "Gagal membuat link kalender baru");
    } finally {
      setIsRegenerating(false);
    }
  };

  const baseUrl = window.location.origin;
  const httpFeedUrl = calendarPath ? `${baseUrl}${calendarPath}` : "";
  const webcalFeedUrl = httpFeedUrl ? calendarService.getWebcalUrl(httpFeedUrl) : "";
  const googleSubscribeUrl = httpFeedUrl
    ? calendarService.getGoogleCalendarSubscribeUrl(httpFeedUrl)
    : "";

  const handleCopyUrl = (urlToCopy: string) => {
    if (!urlToCopy) return;
    navigator.clipboard.writeText(urlToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return {
    isLoading,
    isCopied,
    isRegenerating,
    error,
    webcalFeedUrl,
    googleSubscribeUrl,
    handleRegenerateToken,
    handleCopyUrl,
  };
}
