import { motion } from "framer-motion";
import { Download, Link2, Settings } from "lucide-react";
import { useState } from "react";

export default function Downloader() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const [videoInfo, setVideoInfo] = useState<{ title: string; thumbnail: string; platform: string } | null>(null);
    const [downloadUrl, setDownloadUrl] = useState("");

    const handleDownload = async () => {
        if (!url) return;

        setLoading(true);
        setStatus("Analyzing link...");
        setVideoInfo(null);
        setDownloadUrl("");

        try {
            // Call backend API
            const response = await fetch("http://localhost:5000/api/resolve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("Video found!");
                setVideoInfo({
                    title: data.title,
                    thumbnail: "", // API might not always return thumbnail in resolve for speed, can add if needed
                    platform: "video",
                });
                setDownloadUrl(data.url);
                setLoading(false);
            } else {
                setStatus(`Error: ${data.error || "Failed to resolve video"}`);
                setLoading(false);
            }

        } catch (error) {
            console.error(error);
            setStatus("Error connecting to server. Make sure the backend is running!");
            setLoading(false);
        }
    };

    const triggerDownload = () => {
        if (downloadUrl) {
            // Use local proxy to avoid 403 Forbidden (Varnish/CDN errors)
            const proxyLink = `http://localhost:5000/api/proxy?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(videoInfo?.title || 'video')}.mp4`;
            window.open(proxyLink, "_blank");
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
                background: "transparent", // Use global background or transparent
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

            {status && !downloadUrl && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: "1.5rem",
                        padding: "1rem",
                        background: "rgba(59, 130, 246, 0.2)",
                        border: "1px solid rgba(59, 130, 246, 0.4)",
                        borderRadius: "0.5rem",
                        color: "#93c5fd"
                    }}
                >
                    {status}
                </motion.div>
            )}

            {downloadUrl && (
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
                    <div style={{ color: "white", fontSize: "1.2rem" }}>{videoInfo?.title}</div>

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
                        Download Video
                    </button>

                    <button
                        onClick={() => { setDownloadUrl(""); setStatus(""); setUrl(""); }}
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

            {!downloadUrl && (
                <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                    <button
                        style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "none",
                            borderRadius: "0.5rem",
                            padding: "0.5rem 1rem",
                            color: "white",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <Settings size={16} /> Settings
                    </button>
                </div>
            )}
        </motion.div>
    );
}
