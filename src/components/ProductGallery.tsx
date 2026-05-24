import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

interface ProductGalleryProps {
  mainImage: string;
  images?: string[];
  productName: string;
}

const ProductGallery = ({ mainImage, images, productName }: ProductGalleryProps) => {
  const allImages = images && images.length > 0 ? images : [mainImage];
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Reset to first slide when the image list changes (e.g. variant change)
  useEffect(() => {
    if (emblaApi) emblaApi.scrollTo(0);
  }, [allImages.join("|"), emblaApi]);

  const scrollTo = (i: number) => emblaApi?.scrollTo(i);
  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main carousel */}
      <div className="relative w-full">
        <div className="overflow-hidden rounded-lg bg-white" ref={emblaRef}>
          <div className="flex">
            {allImages.map((img, i) => (
              <div
                key={i}
                className="relative min-w-0 flex-[0_0_100%] flex items-center justify-center p-4 md:p-8"
              >
                <img
                  src={img}
                  alt={`${productName} ${i + 1}`}
                  className="max-h-[400px] w-auto object-contain md:max-h-[640px]"
                  draggable={false}
                 loading="lazy"/>
              </div>
            ))}
          </div>
        </div>

        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Imagem anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Próxima imagem"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>

            {/* Dots (mobile) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`Ir para imagem ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    selectedIndex === i ? "w-5 bg-primary" : "w-1.5 bg-foreground/30"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails (desktop) */}
      {allImages.length > 1 && (
        <div className="hidden md:flex w-full flex-wrap justify-center gap-2">
          {allImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md border-2 bg-white p-1 transition-colors ${
                selectedIndex === i
                  ? "border-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <img
                src={img}
                alt={`${productName} ${i + 1}`}
                className="h-full w-full object-contain"
               loading="lazy"/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
