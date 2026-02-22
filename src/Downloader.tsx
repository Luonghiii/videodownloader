import { motion, AnimatePresence } from "framer-motion";
import { Download, Link2, AlertCircle, History, X, Settings2, Trash2, ClipboardPaste } from "lucide-react";
import { useState, useEffect } from "react";

const SERVER_1_BASE = "https://api1.luonghiii.id.vn";
const SERVER_2_URL = "https://server2.luonghiii.id.vn/api/resolve";

// Helper to determine API endpoint based on URL for Server 1
const getApiEndpoint = (url: string) => {
    if (url.includes("instagram.com") || url.includes("facebook.com")) return `${SERVER_1_BASE}/api/meta/download`;
    if (url.includes("tiktok.com")) return `${SERVER_1_BASE}/api/tiktok/download`;
    if (url.includes("youtube.com") || url.includes("youtu.be")) return `${SERVER_1_BASE}/api/youtube/download`;
    if (url.includes("twitter.com") || url.includes("x.com")) return `${SERVER_1_BASE}/api/twitter/download`;
    if (url.includes("pinterest.com") || url.includes("pin.it")) return `${SERVER_1_BASE}/api/pinterest/download`;
    if (url.includes("reddit.com")) return `${SERVER_1_BASE}/api/reddit/download`;
    if (url.includes("soundcloud.com")) return `${SERVER_1_BASE}/api/soundcloud/download`;
    if (url.includes("spotify.com")) return `${SERVER_1_BASE}/api/spotify/download`;
    if (url.includes("threads.net")) return `${SERVER_1_BASE}/api/threads/download`;
    if (url.includes("tumblr.com")) return `${SERVER_1_BASE}/api/tumblr/download`;
    if (url.includes("linkedin.com")) return `${SERVER_1_BASE}/api/linkedin/download`;
    if (url.includes("douyin.com")) return `${SERVER_1_BASE}/api/douyin/download`;
    if (url.includes("kuaishou.com")) return `${SERVER_1_BASE}/api/kuaishou/download`;
    if (url.includes("bsky.app")) return `${SERVER_1_BASE}/api/bluesky/download`;
    if (url.includes("capcut.com")) return `${SERVER_1_BASE}/api/capcut/download`;
    if (url.includes("dailymotion.com")) return `${SERVER_1_BASE}/api/dailymotion/download`;
    if (url.includes("snapchat.com")) return `${SERVER_1_BASE}/api/snapchat/download`;
    if (url.includes("terabox.com")) return `${SERVER_1_BASE}/api/terabox/download`;

    // Fallback if platform not detected but user wants Server 1 (might fail)
    return `${SERVER_1_BASE}/api/meta/download`;
};

// Interface for History Items
interface HistoryItem {
    id: string;
    title: string;
    thumbnail: string;
    url: string; // The user input URL
    timestamp: number;
    platform: string;
}

export default function Downloader() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    // Server Mode: 'auto' | 'server1' | 'server2'
    const [serverMode, setServerMode] = useState<"auto" | "server1" | "server2">("auto");

    const [videoInfo, setVideoInfo] = useState<{ title: string; thumbnail: string; platform: string } | null>(null);
    const [downloadUrl, setDownloadUrl] = useState("");
    const [formats, setFormats] = useState<any[]>([]); // Store available formats/qualities
    const [selectedFormat, setSelectedFormat] = useState("");

    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Load history on mount
    useEffect(() => {
        const saved = localStorage.getItem("downloader_history");
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const addToHistory = (info: { title: string; thumbnail: string; url: string }) => {
        const newItem: HistoryItem = {
            id: Date.now().toString(),
            title: info.title,
            thumbnail: info.thumbnail,
            url: info.url,
            timestamp: Date.now(),
            platform: "video" // Could infer from URL
        };

        const updatedHistory = [newItem, ...history.filter(h => h.url !== info.url)].slice(0, 20); // Keep last 20 unique
        setHistory(updatedHistory);
        localStorage.setItem("downloader_history", JSON.stringify(updatedHistory));
    };

    const clearHistory = () => {
        if (window.confirm("Delete all history?")) {
            setHistory([]);
            localStorage.removeItem("downloader_history");
        }
    };

    const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = history.filter(h => h.id !== id);
        setHistory(updated);
        localStorage.setItem("downloader_history", JSON.stringify(updated));
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setUrl(text);
                handleDownload(text);
            }
        } catch (err) {
            console.error("Failed to read clipboard", err);
            // Fallback: focus input if paste fails
            const input = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (input) input.focus();
        }
    };

    const handleClear = () => {
        setUrl("");
        setVideoInfo(null);
        setDownloadUrl("");
        setFormats([]);
        setStatus("");
    };

    const formatResolution = (fmt: any) => {
        let res = "Unknown";
        if (fmt.label) {
            res = fmt.label;
        } else if (fmt.resolution) {
            res = fmt.resolution;
        } else if (fmt.text) {
            res = fmt.text;
        } else if (fmt.width && fmt.height) {
            res = `${fmt.width}x${fmt.height}`;
        } else if (fmt.quality) {
            res = fmt.quality;
        }

        // Add 'p' if missing and it looks like a resolution numeric only
        if (res !== "Unknown" && /^\d+$/.test(res)) {
            res += "p";
        }

        // Check audio/video presence
        const hasAudio = fmt.has_audio || (fmt.acodec && fmt.acodec !== "none");
        const hasVideo = fmt.vcodec && fmt.vcodec !== "none";

        if (hasVideo && !hasAudio) return `${res} (No Audio)`;
        if (!hasVideo && hasAudio) return `${res} [${fmt.ext || 'audio'}]`;
        return res;
    };

    const handleDownload = async (inputUrl: string = url) => {
        // Extract the actual URL if there's extra text (common in Douyin/TikTok shares)
        const urlMatch = inputUrl.match(/(https?:\/\/[^\s]+)/);
        const targetUrl = urlMatch ? urlMatch[0] : inputUrl.trim();

        if (!targetUrl) return;

        // If triggered from history or other means, update state with cleaned URL
        if (targetUrl !== url) setUrl(targetUrl);

        setLoading(true);
        setStatus("Analyzing...");
        setVideoInfo(null);
        setDownloadUrl("");
        setFormats([]);
        setSelectedFormat("");

        let success = false;
        let finalVideoInfo = null;

        // --- STRATEGY PATTERN ---
        const tryServer2 = async () => {
            console.log("Trying Server 2...");
            // Server 2: GET /api/resolve?url=...
            const server2ApiUrl = `${SERVER_2_URL}?url=${encodeURIComponent(targetUrl)}`;
            const response = await fetch(server2ApiUrl);
            const data = await response.json();

            if (response.ok && !data.error) {
                return data;
            }
            throw new Error(data.error || "Server 2 failed");
        };

        const tryServer1 = async () => {
            console.log("Trying Server 1...");
            const endpoint = getApiEndpoint(targetUrl);
            const server1ApiUrl = `${endpoint}?url=${encodeURIComponent(targetUrl)}`;
            const response = await fetch(server1ApiUrl);
            const data = await response.json();

            if (response.ok && data.success) {
                return data;
            }
            throw new Error("Server 1 failed");
        };

        // Execution Logic based on Mode
        try {
            let data = null;
            let usedServer = "";

            if (serverMode === "server2") {
                data = await tryServer2();
                usedServer = "server2";
            } else if (serverMode === "server1") {
                data = await tryServer1();
                usedServer = "server1";
            } else {
                // AUTO MODE
                try {
                    data = await tryServer2();
                    usedServer = "server2";
                } catch (e) {
                    console.warn("Auto: Server 2 failed, switching to Server 1");
                    data = await tryServer1();
                    usedServer = "server1";
                }
            }

            // --- PARSE RESPONSE ---
            if (data) {
                let title = "Video Found";
                let thumbnail = "";
                let videoUrl = "";
                let availableFormats: any[] = [];

                if (usedServer === "server2") {
                    title = data.title || "Video Found";
                    thumbnail = data.thumbnail || "";
                    videoUrl = data.url || "";
                    if (data.formats && Array.isArray(data.formats)) {
                        availableFormats = data.formats;
                    }
                } else {
                    // Server 1
                    if (data.data) {
                        const apiData = data.data;
                        title = apiData.title || "Video Download";
                        thumbnail = apiData.thumbnail || "";

                        // Handle 'downloads' array (TikTok etc)
                        if (apiData.downloads && Array.isArray(apiData.downloads)) {
                            availableFormats = apiData.downloads.map((item: any) => ({
                                ...item,
                                resolution: item.text || item.label || "HD",
                                url: item.url,
                                ext: (item.text || item.label)?.toLowerCase().includes("mp3") ? "mp3" : "mp4",
                                has_audio: true,
                                acodec: "aac",
                                vcodec: (item.text || item.label)?.toLowerCase().includes("mp3") ? "none" : "h264"
                            }));
                        }
                        // Handle 'medias' array (SoundCloud etc)
                        else if (apiData.medias && Array.isArray(apiData.medias)) {
                            availableFormats = apiData.medias.map((item: any) => ({
                                ...item,
                                resolution: item.quality || item.label || "Audio",
                                quality: item.quality,
                                url: item.url,
                                ext: item.extension || "mp3",
                                formattedSize: item.formattedSize,
                                filesize: item.size,
                                has_audio: true,
                                acodec: "aac",
                                vcodec: "none"
                            }));
                        }
                        // Handle 'data' array (Instagram etc)
                        else if (apiData.data && Array.isArray(apiData.data)) {
                            availableFormats = apiData.data.map((item: any) => ({
                                ...item,
                                resolution: item.resolution || item.label || "HD",
                                url: item.url,
                                ext: "mp4",
                                has_audio: true,
                                acodec: "aac",
                                vcodec: "h264"
                            }));
                            if (!thumbnail && apiData.data[0]?.thumbnail) {
                                thumbnail = apiData.data[0].thumbnail;
                            }
                        }
                        // Handle 'links' array
                        else if (apiData.links && Array.isArray(apiData.links)) {
                            availableFormats = apiData.links.map((item: any) => ({
                                ...item,
                                resolution: item.quality || item.label || "HD",
                                url: item.link || item.url,
                                ext: "mp4",
                                has_audio: true,
                                acodec: "aac",
                                vcodec: "h264"
                            }));
                        }
                        // Handle 'videos' array
                        else if (apiData.videos && Array.isArray(apiData.videos) && apiData.videos.length > 0) {
                            availableFormats = apiData.videos.map((item: any) => ({
                                ...item,
                                resolution: item.quality || item.label || "HD",
                                url: item.url || item.link,
                                ext: "mp4",
                                has_audio: true,
                                acodec: "aac",
                                vcodec: "h264"
                            }));
                        }
                        // Handle 'images' array (Twitter/X photo posts)
                        else if (apiData.images && Array.isArray(apiData.images) && apiData.images.length > 0) {
                            availableFormats = apiData.images.map((item: any, idx: number) => ({
                                ...item,
                                resolution: `Ảnh ${idx + 1}`,
                                url: item.url || item.link,
                                ext: "jpg",
                                has_audio: false,
                                acodec: "none",
                                vcodec: "none"
                            }));
                        }

                        // Set direct videoUrl if available
                        // Only ignore if it looks exactly like the input AND it doesn't look like a direct CDN link
                        const isCdnLink = (u: string) => u.includes("cdn") || u.includes("tiktokcdn") || u.includes("douyincdn") || u.includes("googlevideo") || u.includes(".mp4") || u.includes(".mp3");

                        if (apiData.url && (apiData.url !== targetUrl || isCdnLink(apiData.url))) {
                            videoUrl = apiData.url;
                        } else if (apiData.link) {
                            videoUrl = apiData.link;
                        } else if (apiData.video) {
                            videoUrl = apiData.video;
                        }
                    }
                }

                if (availableFormats.length > 0 || videoUrl) {
                    setStatus("Đã tìm thấy nội dung! Chọn chất lượng bên dưới.");
                    const info = {
                        title: title || "Downloaded Video",
                        thumbnail,
                        platform: "video",
                        url: targetUrl
                    };
                    setVideoInfo(info);
                    finalVideoInfo = info;

                    // Filter valid formats
                    const validFormats = availableFormats.filter((f: any) => f.url);

                    if (validFormats.length > 0) {
                        setFormats(validFormats);
                        // Default to best quality usually at end or start? 
                        // Server 2 usually sends low->high or high->low. Let's pick the last one if it seems sorted by size, 
                        // code in app.py says user reversed it to put best first. So take 0.
                        setDownloadUrl(validFormats[0].url);
                        setSelectedFormat(validFormats[0].url);
                    } else if (videoUrl) {
                        setDownloadUrl(videoUrl);
                        setSelectedFormat(videoUrl);
                    }
                    success = true;
                }
            }
        } catch (error) {
            console.error("Download failed:", error);
        }

        if (success && finalVideoInfo) {
            addToHistory(finalVideoInfo);
        } else {
            setStatus("Error: Could not resolve video. try changing server mode.");
        }

        setLoading(false);
    };

    const triggerDownload = async () => {
        const targetUrl = selectedFormat || downloadUrl;
        if (!targetUrl || isDownloading) return;

        const currentFmt = formats.find(f => f.url === targetUrl);
        const extension = currentFmt?.ext || (targetUrl.split('.').pop()?.split('?')[0]) || "mp4";

        setIsDownloading(true);
        setStatus("Đang chuẩn bị file...");

        try {
            // Try to fetch as Blob for direct download
            const response = await fetch(targetUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = videoInfo?.title ? `${videoInfo.title}.${extension}` : `file.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            setStatus("Đang bắt đầu tải...");
        } catch (error) {
            console.warn("Blob download failed, falling back to new tab", error);
            // Fallback: Open in new tab with download attribute hint
            const link = document.createElement('a');
            link.href = targetUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.download = videoInfo?.title || "file";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setStatus("Đã mở link tải trong tab mới.");
        } finally {
            setTimeout(() => {
                setIsDownloading(false);
                setStatus("");
            }, 3000);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="downloader-container"
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start", // Changed to flex-start for scrolling
                minHeight: "100vh",
                background: "transparent",
                color: "white",
                fontFamily: "'Inter', sans-serif",
                padding: "2rem 1rem 4rem 1rem", // Added more bottom padding
                boxSizing: "border-box"
            }}
        >
            <div style={{ textAlign: "center", marginBottom: "2rem", width: "100%" }}>
                <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.5rem)", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                    Social Media<span style={{
                        background: "linear-gradient(to right, #00c4cc, #8b3dff)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}> Downloader</span>
                </h1>
                <p style={{ opacity: 0.7, marginTop: "0.5rem", fontSize: "clamp(0.8rem, 2vw, 0.9rem)" }}>
                    Save what you love without ads or trackers.
                </p>

                {/* Server Switcher UI */}
                <div style={{
                    marginTop: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    flexWrap: "wrap"
                }}>
                    <button
                        onClick={() => setServerMode("auto")}
                        style={{
                            padding: "0.4rem 1rem",
                            borderRadius: "20px",
                            border: serverMode === "auto" ? "1px solid #00c4cc" : "1px solid rgba(255,255,255,0.1)",
                            background: serverMode === "auto" ? "rgba(0, 196, 204, 0.1)" : "transparent",
                            color: serverMode === "auto" ? "#00c4cc" : "rgba(255,255,255,0.6)",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            transition: "all 0.2s"
                        }}
                    >
                        Auto (Recommended)
                    </button>
                    <button
                        onClick={() => setServerMode("server2")}
                        style={{
                            padding: "0.4rem 1rem",
                            borderRadius: "20px",
                            border: serverMode === "server2" ? "1px solid #8b3dff" : "1px solid rgba(255,255,255,0.1)",
                            background: serverMode === "server2" ? "rgba(139, 61, 255, 0.1)" : "transparent",
                            color: serverMode === "server2" ? "#8b3dff" : "rgba(255,255,255,0.6)",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            transition: "all 0.2s"
                        }}
                    >
                        Server 2 (yt-dlp)
                    </button>
                    <button
                        onClick={() => setServerMode("server1")}
                        style={{
                            padding: "0.4rem 1rem",
                            borderRadius: "20px",
                            border: serverMode === "server1" ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.1)",
                            background: serverMode === "server1" ? "rgba(34, 197, 94, 0.1)" : "transparent",
                            color: serverMode === "server1" ? "#22c55e" : "rgba(255,255,255,0.6)",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            transition: "all 0.2s"
                        }}
                    >
                        Server 1 (Faster)
                    </button>
                </div>
            </div>

            {/* Input Area */}
            <div
                className="input-group"
                style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    padding: "0.5rem",
                    borderRadius: "1rem",
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    maxWidth: "600px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                    zIndex: 10,
                    marginBottom: "1rem"
                }}
            >
                <Link2 size={20} style={{ margin: "0 0.8rem", opacity: 0.5, flexShrink: 0 }} />
                <input
                    type="text"
                    placeholder="Dán link vào đây..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDownload()}
                    onPaste={(e) => {
                        const pastedData = e.clipboardData.getData('text');
                        if (pastedData) {
                            handleDownload(pastedData);
                        }
                    }}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "white",
                        fontSize: "1rem",
                        flex: 1,
                        outline: "none",
                        padding: "0.5rem 0",
                        minWidth: 0 // Important for flex text truncate
                    }}
                />

                {url && (
                    <button
                        onClick={() => setUrl("")}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "rgba(255,255,255,0.5)",
                            cursor: "pointer",
                            padding: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <X size={18} />
                    </button>
                )}

                <button
                    onClick={() => {
                        if (loading) return;
                        if (url) {
                            handleClear();
                        } else {
                            handlePaste();
                        }
                    }}
                    disabled={loading}
                    style={{
                        background: loading ? "#64748b" : (url ? "#ef4444" : "linear-gradient(to right, #00c4cc, #8b3dff)"),
                        border: "none",
                        borderRadius: "0.75rem",
                        padding: "0.75rem 1rem",
                        color: "white",
                        fontWeight: 600,
                        cursor: loading ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "all 0.2s",
                        opacity: loading ? 0.7 : 1,
                        boxShadow: url ? "0 4px 15px rgba(239, 68, 68, 0.3)" : "0 4px 15px rgba(139, 61, 255, 0.4)",
                        marginLeft: "0.5rem",
                        flexShrink: 0,
                        fontSize: "0.9rem",
                        minWidth: "90px",
                        justifyContent: "center"
                    }}
                >
                    {loading ? (
                        <div className="spinner" style={{
                            width: "20px",
                            height: "20px",
                            border: "2px solid white",
                            borderTop: "2px solid transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite"
                        }} />
                    ) : (
                        url ? (
                            <>
                                <X size={18} />
                                <span>Xoá</span>
                            </>
                        ) : (
                            <>
                                <ClipboardPaste size={18} />
                                <span>Dán</span>
                            </>
                        )
                    )}
                </button>
            </div>

            {/* History Toggle */}
            <div style={{ display: "flex", justifyContent: "center", width: "100%", maxWidth: "600px" }}>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem"
                    }}
                >
                    <History size={16} /> {showHistory ? "Hide History" : "Recent Downloads"}
                </button>
            </div>

            {/* History Panel */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                            width: "100%",
                            maxWidth: "600px",
                            overflow: "hidden",
                            background: "rgba(0,0,0,0.2)",
                            borderRadius: "1rem",
                            marginTop: "0.5rem"
                        }}
                    >
                        <div style={{ padding: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>Saved locally</span>
                                <button onClick={clearHistory} style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: "0.8rem", cursor: "pointer" }}>Clear All</button>
                            </div>

                            {history.length === 0 ? (
                                <div style={{ textAlign: "center", opacity: 0.4, padding: "1rem" }}>No history yet</div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    {history.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleDownload(item.url)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "1rem",
                                                background: "rgba(255,255,255,0.05)",
                                                padding: "0.5rem",
                                                borderRadius: "0.5rem",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <div style={{
                                                width: "50px",
                                                height: "50px",
                                                borderRadius: "0.25rem",
                                                overflow: "hidden",
                                                flexShrink: 0,
                                                background: "#000"
                                            }}>
                                                {item.thumbnail ? (
                                                    <img src={item.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <Settings2 size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.9rem", fontWeight: 500 }}>
                                                    {item.title}
                                                </div>
                                                <div style={{ fontSize: "0.75rem", opacity: 0.5 }}>
                                                    {new Date(item.timestamp).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => deleteHistoryItem(item.id, e)}
                                                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", padding: "0.5rem", cursor: "pointer" }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {status && (!downloadUrl && formats.length === 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: "1.5rem",
                        padding: "1rem",
                        background: "rgba(59, 130, 246, 0.2)",
                        border: "1px solid rgba(59, 130, 246, 0.4)",
                        borderRadius: "0.5rem",
                        color: "#93c5fd",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                        maxWidth: "600px",
                        boxSizing: "border-box"
                    }}
                >
                    <AlertCircle size={20} />
                    <span>{status}</span>
                </motion.div>
            )}

            {(downloadUrl || formats.length > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: "2rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1rem",
                        width: "100%",
                        maxWidth: "600px"
                    }}
                >
                    {videoInfo?.thumbnail && !(selectedFormat || downloadUrl) && (
                        <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
                            <img
                                src={videoInfo.thumbnail}
                                alt={videoInfo.title}
                                style={{
                                    width: "100%",
                                    borderRadius: "1rem",
                                    boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                                }}
                            />
                        </div>
                    )}

                    {(selectedFormat || downloadUrl) && (
                        <div style={{ width: "100%", maxWidth: "400px", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
                            {(() => {
                                const currentUrl = selectedFormat || downloadUrl;
                                const isImage = formats.find(f => f.url === currentUrl)?.ext?.match(/jpg|jpeg|png|webp|gif/i) || currentUrl.match(/\.(jpg|jpeg|png|webp|gif)/i);

                                if (isImage) {
                                    return (
                                        <img
                                            src={currentUrl}
                                            alt="Preview"
                                            style={{ width: "100%", height: "auto", display: "block" }}
                                        />
                                    );
                                }
                                return (
                                    <video
                                        src={currentUrl}
                                        controls
                                        poster={videoInfo?.thumbnail}
                                        style={{ width: "100%", display: "block" }}
                                    />
                                );
                            })()}
                            <div style={{ padding: "0.5rem", background: "rgba(0,0,0,0.5)", fontSize: "0.8rem", textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
                                Mẹo: Chuột phải chọn "Lưu về máy" nếu tải về bị lỗi
                            </div>
                        </div>
                    )}
                    <div style={{
                        color: "white",
                        fontSize: "1.1rem",
                        textAlign: "center",
                        padding: "0 1rem",
                        lineHeight: 1.4
                    }}>
                        {videoInfo?.title}
                    </div>

                    {/* Format Selection UI */}
                    {formats.length > 0 && (
                        <div style={{ width: "100%", maxWidth: "300px" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", opacity: 0.7 }}>Select Quality:</label>
                            <select
                                value={selectedFormat}
                                onChange={(e) => setSelectedFormat(e.target.value)}
                                style={{
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    background: "rgba(0,0,0,0.6)",
                                    color: "white",
                                    width: "100%",
                                    cursor: "pointer",
                                    fontSize: "1rem",
                                    outline: "none"
                                }}
                            >
                                {formats.map((fmt, idx) => (
                                    <option key={idx} value={fmt.url} style={{ background: "#222" }}>
                                        {formatResolution(fmt)} {fmt.formattedSize ? `- ${fmt.formattedSize}` : (fmt.filesize ? `- ${(fmt.filesize / 1024 / 1024).toFixed(1)} MB` : "")}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={triggerDownload}
                        disabled={isDownloading}
                        style={{
                            background: isDownloading ? "#64748b" : "#22c55e",
                            border: "none",
                            borderRadius: "0.75rem",
                            padding: "1rem 2rem",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "1.1rem",
                            cursor: isDownloading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            boxShadow: isDownloading ? "none" : "0 4px 15px rgba(34, 197, 94, 0.4)",
                            width: "100%",
                            maxWidth: "300px",
                            justifyContent: "center",
                            marginTop: "0.5rem"
                        }}
                    >
                        {isDownloading ? (
                            <div className="spinner" style={{
                                width: "24px",
                                height: "24px",
                                border: "3px solid white",
                                borderTop: "3px solid transparent",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite"
                            }} />
                        ) : (
                            <Download size={24} />
                        )}
                        {isDownloading ? "Đang xử lý..." : "Download Now"}
                    </button>

                    <button
                        onClick={() => { setDownloadUrl(""); setStatus(""); setUrl(""); setFormats([]); setVideoInfo(null); }}
                        style={{
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "0.5rem",
                            padding: "0.75rem 1rem",
                            color: "rgba(255,255,255,0.7)",
                            cursor: "pointer",
                            marginTop: "0.5rem",
                            width: "100%",
                            maxWidth: "300px"
                        }}
                    >
                        Download Another
                    </button>
                </motion.div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </motion.div>
    );
}
