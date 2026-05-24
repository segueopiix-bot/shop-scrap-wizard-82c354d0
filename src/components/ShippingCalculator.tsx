import { useState } from "react";
import { Truck, Store, Zap } from "lucide-react";
import truckBlueIcon from "@/assets/truck-blue-icon.svg";
import { maskCEP, isValidCEP, fetchAddressByCEP } from "@/utils/checkout-utils";
import { isDrogalCity } from "@/data/drogalCities";

const ShippingCalculator = () => {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<null | { city: string; isDrogal: boolean }>(null);
  const [shippingMethod, setShippingMethod] = useState<string>("");

  const calculate = async () => {
    setError(null);
    setShippingOptions(null);
    if (!isValidCEP(cep)) {
      setError("CEP inválido");
      return;
    }
    setLoading(true);
    const result = await fetchAddressByCEP(cep);
    setLoading(false);
    if (!result) {
      setError("CEP não encontrado");
      return;
    }
    const drogal = isDrogalCity(result.localidade);
    setShippingOptions({ city: `${result.localidade}/${result.uf}`, isDrogal: drogal });
    setShippingMethod(drogal ? "retira" : "correios");
  };

  return (
    <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
      <div className="mb-3 flex items-center gap-2">
        <img src={truckBlueIcon} alt="" className="h-5 w-5"  loading="lazy"/>
        <h2 className="text-sm font-bold text-[#447097]">Calcular Frete</h2>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); calculate(); }}
        className="flex items-center gap-2 rounded-full border border-gray-200 p-1 pl-4"
      >
        <input
          type="text"
          value={cep}
          onChange={(e) => setCep(maskCEP(e.target.value))}
          placeholder="Insira seu CEP"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#29ABE2] px-6 py-2 text-sm font-bold text-white hover:bg-[#229abf] disabled:opacity-60"
        >
          {loading ? "..." : "Calcular"}
        </button>
      </form>
      <a
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs font-semibold text-[#29ABE2] underline"
      >
        Não sei meu CEP
      </a>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {shippingOptions && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            Entregamos em <span className="font-semibold text-foreground">{shippingOptions.city}</span>
          </p>
          {shippingOptions.isDrogal ? (
            [
              { id: "retira", icon: Store, title: "Retira em Loja", subtitle: "Em até 60 minutos" },
              { id: "expressa", icon: Zap, title: "Expressa", subtitle: "Em até 4 horas" },
            ].map(({ id, icon: Icon, title, subtitle }) => {
              const selected = shippingMethod === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setShippingMethod(id)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
                    selected ? "border-[#29ABE2] bg-white" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-[#29ABE2]" : "border-gray-300"}`}>
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#29ABE2]" />}
                  </span>
                  <Icon className="h-6 w-6 flex-shrink-0 text-foreground" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">{title}</p>
                    <p className="text-[11px] text-muted-foreground">{subtitle}</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">Grátis</span>
                </button>
              );
            })
          ) : (
            <button
              type="button"
              onClick={() => setShippingMethod("correios")}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
                shippingMethod === "correios" ? "border-[#29ABE2] bg-white" : "border-gray-200 bg-white"
              }`}
            >
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${shippingMethod === "correios" ? "border-[#29ABE2]" : "border-gray-300"}`}>
                {shippingMethod === "correios" && <span className="h-2.5 w-2.5 rounded-full bg-[#29ABE2]" />}
              </span>
              <Truck className="h-6 w-6 flex-shrink-0 text-foreground" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">Correios</p>
                <p className="text-[11px] text-muted-foreground">2 a 4 dias úteis</p>
              </div>
              <span className="text-sm font-bold text-green-600">Grátis</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ShippingCalculator;
