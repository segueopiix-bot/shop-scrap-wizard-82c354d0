import { Truck, CreditCard, Shield, Percent } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const benefits = [
  { icon: Truck, title: "FRETE GRÁTIS", subtitle: "PARA TODO O BRASIL" },
  { icon: Percent, title: "DESCONTO DE 10%", subtitle: "NO PIX" },
  { icon: CreditCard, title: "DIVIDIMOS NO CARTÃO", subtitle: "ATÉ 6X SEM JUROS" },
  { icon: Shield, title: "SEGURANÇA", subtitle: "LOJA COM SSL DE PROTEÇÃO" },
];

const BenefitsBar = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % benefits.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="border-t border-border bg-secondary py-10">
      {/* Desktop: grid normal */}
      <div className="container-page hidden gap-6 md:grid md:grid-cols-4">
        {benefits.map((b) => (
          <div key={b.title} className="flex flex-col items-center text-center">
            <b.icon className="mb-3 h-10 w-10 text-primary" />
            <h3 className="text-sm font-bold text-foreground">{b.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{b.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Mobile: slide automático */}
      <div className="flex flex-col items-center md:hidden">
        <div className="flex flex-col items-center text-center transition-opacity duration-500">
          {(() => {
            const b = benefits[current];
            return (
              <>
                <b.icon className="mb-3 h-10 w-10 text-primary" />
                <h3 className="text-sm font-bold text-foreground">{b.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{b.subtitle}</p>
              </>
            );
          })()}
        </div>
        <div className="mt-4 flex gap-2">
          {benefits.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 w-2 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsBar;
