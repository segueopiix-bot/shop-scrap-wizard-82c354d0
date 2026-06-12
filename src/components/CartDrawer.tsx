import { useEffect } from "react";
import { Minus, Plus, ShoppingCart, X, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Link, useNavigate } from "react-router-dom";

const prefetchCheckout = () => {
  import("@/pages/CheckoutPage");
};

const formatPrice = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen || items.length > 0) prefetchCheckout();
  }, [isOpen, items.length]);

  const goToCheckout = () => {
    setIsOpen(false);
    navigate("/checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        className="flex w-[88vw] flex-col gap-0 bg-[#f5f5f5] p-0 sm:max-w-md sm:w-full [&>button]:hidden h-[100dvh] fixed top-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-[#29ABE2] px-4 py-4 text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            <span className="text-base font-semibold">Meu carrinho</span>
          </div>
          <button onClick={() => setIsOpen(false)} aria-label="Fechar" className="text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-muted-foreground">
            <ShoppingCart className="h-12 w-12" />
            <p className="text-sm">Seu carrinho está vazio</p>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-2 rounded-md bg-[#29ABE2] px-6 py-2 text-sm font-semibold text-white hover:bg-[#1f8fbf]"
            >
              Continuar comprando
            </button>
          </div>
        ) : (
          <>
            {/* Items area */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.product.id}__${item.variant || ""}`}
                  className="relative flex gap-3 rounded-md bg-white p-3"
                >
                  <button
                    onClick={() => removeItem(item.product.id, item.variant)}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-700"
                    aria-label="Remover"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <Link
                    to={`/produtos/${item.product.id}`}
                    onClick={() => setIsOpen(false)}
                    className="h-20 w-20 flex-shrink-0"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-full w-full object-contain"
                     loading="lazy"/>
                  </Link>
                  <div className="flex flex-1 flex-col pr-4">
                    <Link
                      to={`/produtos/${item.product.id}`}
                      onClick={() => setIsOpen(false)}
                      className="text-[13px] leading-tight text-gray-700 no-underline hover:text-[#29ABE2] line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    <div className="mt-1 text-sm font-bold text-gray-700">
                      {formatPrice(item.product.price)}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
                        aria-label="Diminuir"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[20px] text-center text-sm font-semibold text-gray-700">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
                        aria-label="Aumentar"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-white px-4 py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-semibold text-gray-700">{formatPrice(totalPrice)}</span>
              </div>
              <div className="mb-4 flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-base font-bold text-gray-800">Total</span>
                <span className="text-base font-bold text-gray-800">{formatPrice(totalPrice)}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="mb-2 w-full rounded-full border-2 border-[#2bb5a0] bg-white py-2.5 text-sm font-bold text-[#2bb5a0] hover:bg-[#2bb5a0]/5"
              >
                Continuar Comprando
              </button>
              <button
                type="button"
                onClick={goToCheckout}
                className="block w-full rounded-full bg-[#2bb5a0] py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#249e8b]"
              >
                Finalizar Pedido
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
