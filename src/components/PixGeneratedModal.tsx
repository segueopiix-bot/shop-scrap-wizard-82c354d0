import { useCallback, useRef, useState } from "react";
import { X, HelpCircle, ShoppingCart, ChevronDown } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import pixLogo from "@/assets/pix-logo.png";

interface PixGeneratedModalProps {
  open: boolean;
  onClose: () => void;
  storeName: string;
  amount: number;
  copyPasteCode: string;
}

const formatPrice = (value: number) =>
  `R$ ${value.toFixed(2).replace(".", ",")}`;

const PixGeneratedModal = ({
  open,
  onClose,
  storeName,
  amount,
  copyPasteCode,
}: PixGeneratedModalProps) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const handleCopy = useCallback(async () => {
    if (!copyPasteCode) return;
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(copyPasteCode);
      } else if (codeRef.current) {
        codeRef.current.select();
        document.execCommand("copy");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn("copy failed", e);
    }
  }, [copyPasteCode]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] max-h-[95vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Pix logo and close */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <img src={pixLogo} alt="Pix" className="h-10 w-auto"  loading="lazy"/>
          <div className="flex items-center gap-3 text-gray-500">
            <button type="button" aria-label="Ajuda" className="hover:text-gray-700">
              <HelpCircle className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Fechar"
              onClick={onClose}
              className="hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-5 space-y-3">
          {/* Store + amount card */}
          <div className="rounded-xl border border-gray-200 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-[#c92064]">
                  <ShoppingCart className="h-5 w-5 text-[#c92064]" />
                </div>
                <span className="text-[15px] font-medium text-gray-800 truncate">
                  {storeName}
                </span>
              </div>
              <ChevronDown className="h-5 w-5 shrink-0 text-gray-500" />
            </div>

            <div className="rounded-lg bg-gray-100 py-3 text-center">
              <p className="text-sm text-gray-700">Valor da compra</p>
              <p className="text-base font-bold text-gray-900">
                {formatPrice(amount)}
              </p>
            </div>
          </div>

          {/* Pix code card */}
          <div className="rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="flex justify-center -mt-7">
              <span className="rounded-full bg-gray-100 px-4 py-1 text-xs font-medium text-gray-700 border border-white">
                Pix à vista
              </span>
            </div>

            <p className="text-center text-[13px] text-gray-700 leading-snug px-2">
              Complete sua compra com o Pix copia-e-cola ou o QR code no
              aplicativo de seu banco.
            </p>

            {/* Status badge */}
            <div className="flex justify-center">
              <span className="rounded-md bg-[#c8f0d0] px-4 py-1.5 text-[13px] font-medium text-gray-800">
                {copied ? "Código copiado!" : "aguardando o recebimento do Pix"}
              </span>
            </div>

            {/* Código Pix input + Copiar (label dentro da borda) */}
            <div className="relative rounded-full border-2 border-gray-300 pl-4 pr-1 py-1">
              <span className="absolute -top-2 left-4 bg-white px-1 text-[11px] text-gray-600">
                Código Pix
              </span>
              <div className="flex items-center gap-2">
                <input
                  ref={codeRef}
                  readOnly
                  value={copyPasteCode}
                  className="flex-1 min-w-0 bg-transparent text-sm font-medium text-gray-900 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 self-stretch rounded-full bg-[#1a1a1a] px-5 text-sm font-semibold text-white hover:bg-black transition-colors"
                >
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>

            {/* QR Code */}
            {copyPasteCode && (
              <div className="flex justify-center pt-1">
                <div className="rounded-lg bg-white p-2">
                  <QRCodeSVG value={copyPasteCode} size={200} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixGeneratedModal;

