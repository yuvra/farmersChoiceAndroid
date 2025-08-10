import { create } from "zustand";

interface Product {
  id: string;
  name: string;
  [key: string]: any; // optional for other product fields
}

interface CartStore {
  items: Product[];
  wishlist: Product[];

  addToCart: (item: Product) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  toggleWishlist: (item: Product) => void;
  clearWishlist: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [
    { id: "1", name: "Sample Product" },
    { id: "2", name: "Sample Product 2" },
  ],
  wishlist: [],

  addToCart: (item) => {
    const exists = get().items.find((i) => i.id === item.id);
    if (!exists) {
      set((state) => ({ items: [...state.items, item] }));
    }
  },

  removeFromCart: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),

  clearCart: () => set({ items: [] }),

  toggleWishlist: (item) => {
    const exists = get().wishlist.find((i) => i.id === item.id);
    if (exists) {
      set((state) => ({
        wishlist: state.wishlist.filter((i) => i.id !== item.id),
      }));
    } else {
      set((state) => ({ wishlist: [...state.wishlist, item] }));
    }
  },

  clearWishlist: () => set({ wishlist: [] }),
}));
