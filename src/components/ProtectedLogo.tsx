import { useEffect, useRef, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedLogoProps {
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
  logoType?: "official" | "secondary";
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const CANVAS_WIDTH = 250;
const CANVAS_HEIGHT = 100;

const ProtectedLogo = ({ alt = "Logo", className, style, logoType = "official" }: ProtectedLogoProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadOnce = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("logo-token", {
        body: { type: logoType }
      });
      if (error || !data?.token) return;

      const url = `${SUPABASE_URL}/functions/v1/logo-serve?token=${encodeURIComponent(data.token)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          
          // Calculate scale to maintain aspect ratio without stretching
          const hRatio = CANVAS_WIDTH / img.width;
          const vRatio = CANVAS_HEIGHT / img.height;
          const ratio = Math.min(hRatio, vRatio);
          const centerShift_x = (CANVAS_WIDTH - img.width * ratio) / 2;
          const centerShift_y = (CANVAS_HEIGHT - img.height * ratio) / 2;
          
          ctx.drawImage(
            img, 
            0, 0, img.width, img.height,
            centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
          );
        }
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => URL.revokeObjectURL(objectUrl);
      img.src = objectUrl;
    } catch {
      /* swallow */
    }
  };

  useEffect(() => {
    loadOnce();
    const interval = setInterval(loadOnce, 25 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      role="img"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className={className}
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        userSelect: "none",
        WebkitUserSelect: "none",
        ...style,
      }}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    />
  );
};

export default ProtectedLogo;
