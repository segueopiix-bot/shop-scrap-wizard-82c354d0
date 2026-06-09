import { useEffect, useMemo, useState, type CSSProperties } from "react";
import ProtectedLogo from "./ProtectedLogo";
import { useVisitorSource } from "@/hooks/useVisitorSource";
import { useLogoProtectionSetting } from "@/hooks/useLogoProtectionSetting";


interface LogoSelectorProps {
  // Mantido por compatibilidade; não é mais usado para a logo oficial.
  src?: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
}

const OFFICIAL_LOGO_URL = "https://www.lojas-epoca.store/assets/full-logo-CBRmo0EX.png";
const SECONDARY_LOGO_URL = "https://i.ibb.co/C3ZmBW82/logoloja.webp";
const OFFICIAL_LOGO_WIDTH = 250;
const OFFICIAL_LOGO_HEIGHT = 100;

const BOT_PATTERN = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|outbrain|pinterest|whatsapp|telegrambot|linkedinbot|twitterbot|googlebot|google-inspectiontool|adsbot-google|mediapartners-google|duckduckbot|baiduspider|yandex|sogou|exabot|ia_archiver|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot/i;

const LogoSelector = ({ alt = "Logo", className, width, height, style, src }: LogoSelectorProps) => {
  const { fromGoogleAd } = useVisitorSource();
  const protectionEnabled = useLogoProtectionSetting();
  const resolvedWidth = width ?? OFFICIAL_LOGO_WIDTH;
  const resolvedHeight = height ?? OFFICIAL_LOGO_HEIGHT;

  const isBot = useMemo(() => {
    if (typeof navigator === "undefined") return true;
    return BOT_PATTERN.test(navigator.userAgent || "");
  }, []);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Use a logo secundária se o visitante vier de anúncio do Google
  const effectiveSrc = (src === "secondary" || fromGoogleAd) ? SECONDARY_LOGO_URL : OFFICIAL_LOGO_URL;

  // 1) Proteção ativada (via admin) + visitante de anúncio mobile → logo protegida (canvas)
  if (protectionEnabled && isMobile && fromGoogleAd && !isBot) {
    return <ProtectedLogo alt={alt} className={className} width={resolvedWidth} height={resolvedHeight} style={style} logoType={(src === "secondary" || fromGoogleAd) ? "secondary" : "official"} />;
  }

  // 2) Bot ou visitante direto → logo oficial (ou secundária se solicitado/anúncio)
  return (
    <img
      src={effectiveSrc}
      alt={alt}
      className={className}
      width={resolvedWidth}
      height={resolvedHeight}
      style={style}
      loading="lazy"
    />
  );
};

export default LogoSelector;
