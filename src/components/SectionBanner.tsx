interface SectionBannerProps {
  desktopSrc: string;
  mobileSrc: string;
  alt?: string;
}

const SectionBanner = ({ desktopSrc, mobileSrc, alt = "Banner promocional" }: SectionBannerProps) => {
  return (
    <section className="py-4">
      <div className="container-page">
        <div className="overflow-hidden rounded-xl">
          <img
            src={desktopSrc}
            alt={alt}
            className="hidden w-full object-cover md:block"
           loading="lazy"/>
          <img
            src={mobileSrc}
            alt={alt}
            className="block w-full object-cover md:hidden"
           loading="lazy"/>
        </div>
      </div>
    </section>
  );
};

export default SectionBanner;
