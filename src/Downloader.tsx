import { motion } from "framer-motion";
import { Download, Link2, AlertCircle } from "lucide-react";
import { useState } from "react";

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

export default function Downloader() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    // Removed useServer2 state as we now auto-fallback

    const [videoInfo, setVideoInfo] = useState<{ title: string; thumbnail: string; platform: string } | null>(null);
    const [downloadUrl, setDownloadUrl] = useState("");
    const [formats, setFormats] = useState<any[]>([]); // Store available formats/qualities
    const [selectedFormat, setSelectedFormat] = useState("");

    const handleDownload = async () => {
        if (!url) return;

        setLoading(true);
        setStatus("Analyzing...");
        setVideoInfo(null);
        setDownloadUrl("");
        setFormats([]);
        setSelectedFormat("");

        let success = false;

        // --- TRY SERVER 2 (PRIMARY) ---
        try {
            console.log("Trying Server 2...");
            // Server 2: GET /api/resolve?url=...
            const server2ApiUrl = `${SERVER_2_URL}?url=${encodeURIComponent(url)}`;
            const response = await fetch(server2ApiUrl);
            const data = await response.json();

            if (response.ok && !data.error) {
                // Server 2 Success
                console.log("Server 2 success:", data);

                const title = data.title || "Video Found";
                const thumbnail = data.thumbnail || "";
                const videoUrl = data.url || "";
                let availableFormats: any[] = [];

                if (data.formats && Array.isArray(data.formats)) {
                    availableFormats = data.formats;
                }

                if (availableFormats.length > 0 || videoUrl) {
                    setStatus("Video found! Select quality to download.");
                    setVideoInfo({
                        title: title,
                        thumbnail: thumbnail,
                        platform: "video",
                    });

                    // Filter formats to show only useful ones
                    const validFormats = availableFormats.filter((f: any) => f.url);

                    if (validFormats.length > 0) {
                        setFormats(validFormats);
                        // Default to the first one (usually best)
                        setDownloadUrl(validFormats[0].url);
                        setSelectedFormat(validFormats[0].url);
                    } else {
                        // Fallback if no formats list but direct url exists
                        setDownloadUrl(videoUrl);
                        setSelectedFormat(videoUrl); // Also set selectedFormat for consistency
                    }
                    success = true;
                }
            } else {
                console.warn("Server 2 returned error or empty:", data);
            }
        } catch (error) {
            console.error("Server 2 failed:", error);
        }

        // --- IF SERVER 2 FAILED, TRY SERVER 1 (BACKUP) ---
        if (!success) {
            try {
                setStatus("Primary server failed, trying backup server...");
                console.log("Trying Server 1 (Backup)...");

                const endpoint = getApiEndpoint(url);
                const server1ApiUrl = `${endpoint}?url=${encodeURIComponent(url)}`;

                // Server 1 usually uses GET based on previous code
                const response = await fetch(server1ApiUrl);
                const data = await response.json();

                if (response.ok) {
                    // Check if success structure matches Server 1
                    if (data.success && data.data && data.data.data && data.data.data.length > 0) {
                        const videoData = data.data.data[0];
                        const title = videoData.filename || "Video Download";
                        const thumbnail = videoData.thumbnail || "";
                        const videoUrl = videoData.url || "";

                        // Map Server 1 formats to common structure
                        const availableFormats = data.data.data.map((item: any) => ({
                            resolution: item.resolution || "HD",
                            url: item.url,
                            ext: "mp4",
                            has_audio: true,
                            filesize: null // Server 1 might not give filesize in bytes easy to read
                        }));

                        setStatus("Video found! Select quality to download.");
                        setVideoInfo({
                            title: title,
                            thumbnail: thumbnail,
                            platform: "video",
                        });

                        setFormats(availableFormats);
                        if (availableFormats.length > 0) {
                            setDownloadUrl(availableFormats[0].url);
                            setSelectedFormat(availableFormats[0].url);
                        } else if (videoUrl) {
                            setDownloadUrl(videoUrl);
                        }
                        success = true;
                    }
                }
            } catch (error) {
                console.error("Server 1 failed:", error);
            }
        }

        if (!success) {
            setStatus("Error: Could not resolve video from any server.");
        }

        setLoading(false);
    };

    const triggerDownload = () => {
        const targetUrl = selectedFormat || downloadUrl;
        if (targetUrl) {
            window.open(targetUrl, "_blank");
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
                justifyContent: "center",
                minHeight: "100vh",
                background: "transparent",
                color: "white",
                fontFamily: "'Inter', sans-serif",
            }}
        >
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "3rem", fontWeight: 700, margin: 0 }}>
                    Video<span style={{
                        background: "linear-gradient(to right, #00c4cc, #8b3dff)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}>.Downloader</span>
                </h1>
                <p style={{ opacity: 0.7, marginTop: "0.5rem" }}>
                    Save what you love without ads or trackers.
                </p>
            </div>

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
                    zIndex: 10
                }}
            >
                <Link2 size={24} style={{ margin: "0 1rem", opacity: 0.5 }} />
                <input
                    type="text"
                    placeholder="Paste link here..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDownload()}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "white",
                        fontSize: "1.2rem",
                        flex: 1,
                        outline: "none",
                        padding: "0.5rem",
                    }}
                />
                <button
                    onClick={handleDownload}
                    disabled={loading}
                    style={{
                        background: loading ? "#64748b" : "linear-gradient(to right, #00c4cc, #8b3dff)",
                        border: "none",
                        borderRadius: "0.75rem",
                        padding: "0.75rem 1.5rem",
                        color: "white",
                        fontWeight: 600,
                        cursor: loading ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "all 0.2s",
                        opacity: loading ? 0.7 : 1,
                        boxShadow: "0 4px 15px rgba(139, 61, 255, 0.4)",
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = "scale(1)")}
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
                        <>
                            <Download size={20} />
                            Go
                        </>
                    )}
                </button>
            </div>

            <div style={{
                marginTop: "1.5rem",
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                justifyContent: "center",
                maxWidth: "600px",
                opacity: 0.8
            }}>
                {["YouTube", "TikTok", "Facebook", "Instagram", "X (Twitter)", "Twitch", "Reddit", "SoundCloud", "Vimeo", "Bilibili"].map((platform) => (
                    <span key={platform} style={{
                        background: "rgba(255,255,255,0.1)",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "1rem",
                        fontSize: "0.85rem",
                        border: "1px solid rgba(255,255,255,0.1)",
                        cursor: "default"
                    }}>
                        {platform}
                    </span>
                ))}
            </div>

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
                        gap: "1rem"
                    }}
                >
                    {videoInfo?.thumbnail && (
                        <img
                            src={videoInfo.thumbnail}
                            alt={videoInfo.title}
                            style={{
                                width: "100%",
                                maxWidth: "300px",
                                borderRadius: "1rem",
                                boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                                marginBottom: "1rem"
                            }}
                        />
                    )}
                    <div style={{ color: "white", fontSize: "1.2rem", textAlign: "center", padding: "0 1rem" }}>{videoInfo?.title}</div>

                    {/* Format Selection UI */}
                    {formats.length > 0 && (
                        <select
                            value={selectedFormat}
                            onChange={(e) => setSelectedFormat(e.target.value)}
                            style={{
                                padding: "0.5rem",
                                borderRadius: "0.5rem",
                                border: "1px solid rgba(255,255,255,0.3)",
                                background: "rgba(0,0,0,0.5)",
                                color: "white",
                                width: "100%",
                                maxWidth: "300px",
                                cursor: "pointer",
                                fontSize: "1rem"
                            }}
                        >
                            {formats.map((fmt, idx) => (
                                <option key={idx} value={fmt.url} style={{ background: "#333" }}>
                                    {fmt.resolution} {fmt.filesize ? `- ${(fmt.filesize / 1024 / 1024).toFixed(1)} MB` : ""}
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={triggerDownload}
                        style={{
                            background: "#22c55e", // Green for success
                            border: "none",
                            borderRadius: "0.75rem",
                            padding: "1rem 2rem",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "1.2rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            boxShadow: "0 4px 15px rgba(34, 197, 94, 0.4)",
                            transition: "transform 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                        <Download size={24} />
                        Download {formats.length > 0 ? "Selected" : "Video"}
                    </button>

                    <button
                        onClick={() => { setDownloadUrl(""); setStatus(""); setUrl(""); setFormats([]); setVideoInfo(null); }}
                        style={{
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.3)",
                            borderRadius: "0.5rem",
                            padding: "0.5rem 1rem",
                            color: "rgba(255,255,255,0.7)",
                            cursor: "pointer",
                            marginTop: "1rem"
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
