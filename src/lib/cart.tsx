import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  id: string;
  name: string;
  price: number;
  qty: number;
  stock: number;
  image_url: string | null;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  checkoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "bylisam-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read after mount so the server-rendered markup and first client paint match.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore malformed carts */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage may be unavailable */
    }
  }, [lines, hydrated]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === line.id);
      const max = Math.max(0, line.stock);
      if (existing) {
        return prev.map((l) =>
          l.id === line.id
            ? { ...l, ...line, qty: Math.min(max, l.qty + qty) }
            : l,
        );
      }
      return [...prev, { ...line, qty: Math.min(max, Math.max(1, qty)) }];
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: Math.min(l.stock, Math.max(0, qty)) } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const subtotal = lines.reduce((sum, l) => sum + Number(l.price) * l.qty, 0);
    return { lines, count, subtotal, checkoutOpen, setCheckoutOpen, add, setQty, remove, clear };
  }, [lines, checkoutOpen, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/**
 * Works out how the reward points cover the cart: the first eligible muffins
 * are free, everything after that is charged at the normal price.
 */
export function applyPointsToCart(lines: CartLine[], freeUnits: number) {
  let remaining = Math.max(0, freeUnits);
  const priced = lines.map((line) => {
    const free = Math.min(remaining, line.qty);
    remaining -= free;
    return { ...line, freeQty: free, paidQty: line.qty - free };
  });
  const discount = priced.reduce((sum, l) => sum + l.freeQty * Number(l.price), 0);
  return { priced, discount, unitsRedeemed: Math.max(0, freeUnits) - remaining };
}
