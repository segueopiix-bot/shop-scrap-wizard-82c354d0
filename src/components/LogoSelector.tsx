import { useMemo } from "react";
import ProtectedLogo from "./ProtectedLogo";

interface LogoSelectorProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

const BOT_PATTERN = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|outbrain|pinterest|whatsapp|telegrambot|linkedinbot|twitterbot|googlebot|google-inspectiontool|adsbot-google|mediapartners-google|duckduckbot|baiduspider|yandex|sogou|exabot|ia_archiver|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot/i;

const LogoSelector = ({ src, alt = "Logo", className, width, height }: LogoSelectorProps) => {
  const isBot = useMemo(() => {
    if (typeof navigator === "undefined") return true; // SSR/safety -> serve normal image
    return BOT_PATTERN.test(navigator.userAgent || "");
  }, []);

  if (isBot) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading="lazy"
      />
    );
  }

  return <ProtectedLogo alt={alt} className={className} width={width} height={height} />;
};

export default LogoSelector;
