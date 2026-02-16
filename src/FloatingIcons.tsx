import { motion } from "framer-motion";
import { Youtube, Instagram, Twitter, Facebook, Music, Video, Globe, Hash } from "lucide-react";

const icons = [
    { Icon: Youtube, color: "#ff0000", delay: 0, x: -200, y: -100, size: 40 },
    { Icon: Instagram, color: "#E1306C", delay: 1, x: 200, y: -150, size: 35 },
    { Icon: Twitter, color: "#1DA1F2", delay: 2, x: -150, y: 150, size: 30 },
    { Icon: Facebook, color: "#1877F2", delay: 0.5, x: 180, y: 100, size: 38 },
    { Icon: Music, color: "#1DB954", delay: 1.5, x: 0, y: -200, size: 32 },
    { Icon: Video, color: "#A970FF", delay: 2.5, x: 0, y: 220, size: 45 },
    { Icon: Globe, color: "#00C4CC", delay: 0.8, x: -300, y: 0, size: 50 },
    { Icon: Hash, color: "#FF9900", delay: 1.2, x: 300, y: 50, size: 28 },
];

export default function FloatingIcons() {
    return (
        <div style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 0,
        }}>
            {icons.map((item, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 0, y: 0 }}
                    animate={{
                        opacity: [0, 0.4, 0.4, 0],
                        x: [0, item.x],
                        y: [0, item.y],
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut",
                        delay: item.delay,
                    }}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        marginLeft: -item.size / 2,
                        marginTop: -item.size / 2,
                        color: item.color,
                    }}
                >
                    <item.Icon size={item.size} />
                </motion.div>
            ))}
        </div>
    );
}
