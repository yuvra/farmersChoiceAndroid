// store/useAgriStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";

// Category type
type Category =
    | "Fungicides"
    | "Insecticides"
    | "Herbicides"
    | "Nutrients"
    | "Organic"
    | null;

type CartItem = {
    product: Product;
    variant: Product["mapVariant"][0];
    quantity: number;
};

export interface Product {
    productId: string;
    productName: {
        en: string;
        mr?: string;
        hi?: string;
    };
    productDescription: {
        en: string;
        mr?: string;
        hi?: string;
    };
    productType: {
        en: string;
        mr?: string;
        hi?: string;
    };
    productImages: string[];
    vendor: string;
    showProduct: boolean;
    isOutOfStock: boolean;
    position: number;
    chemicalComposition: string[];
    mapVariant: {
        title: {
            en: string;
            mr?: string;
            hi?: string;
        };
        price: number;
        compareAtPrice: number;
        inventoryQuantity: number;
    }[];
}

type Address = {
    name: string;
    flat: string;
    street: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    landmark: string;
    country: string;
    phone: string;
} | null;

type Store = {
    selectedCategory: Category;
    setSelectedCategory: (category: Category) => void;

    products: Product[];
    setProducts: (p: Product[]) => void;

    loading: boolean;
    setLoading: (val: boolean) => void;
    lastVisibleDoc: any;
    setLastVisibleDoc: (doc: any) => void;

    cartItems: CartItem[];
    addToCart: (product: Product, variant: CartItem["variant"]) => void;
    updateCartItemQty: (
        productId: string,
        variantTitle: string,
        qty: number
    ) => void;
    removeFromCart: (productId: string, variantTitle: string) => void;
    clearCart: () => void;

    address: Address;
    setAddress: (address: Address) => void;
    clearAddress: () => void;
};

export const useAgriStore = create<Store>()(
    persist(
        (set, get) => ({
            selectedCategory: 'Organic',
            setSelectedCategory: (category) =>
                set({ selectedCategory: category }),

            products: [],
            setProducts: (products) => set({ products }),

            loading: false,
            setLoading: (val: boolean) => set(() => ({ loading: val })),
            lastVisibleDoc: null,
            setLastVisibleDoc: (doc: any) =>
                set(() => ({ lastVisibleDoc: doc })),

            cartItems: [],
            addToCart: (product, variant) => {
                const cart = get().cartItems;
                const existingIndex = cart.findIndex(
                    (item) =>
                        item.product.productId === product.productId &&
                        item.variant.title.en === variant.title.en
                );

                if (existingIndex >= 0) {
                    const updatedCart = [...cart];
                    updatedCart[existingIndex].quantity += 1;
                    set({ cartItems: updatedCart });
                } else {
                    set({
                        cartItems: [...cart, { product, variant, quantity: 1 }],
                    });
                }
            },
            updateCartItemQty: (productId, variantTitle, qty) => {
                const updatedCart = get().cartItems.map((item) =>
                    item.product.productId === productId &&
                    item.variant.title.en === variantTitle
                        ? { ...item, quantity: qty }
                        : item
                );
                set({ cartItems: updatedCart });
            },
            removeFromCart: (productId, variantTitle) => {
                const filtered = get().cartItems.filter(
                    (item) =>
                        !(
                            item.product.productId === productId &&
                            item.variant.title.en === variantTitle
                        )
                );
                set({ cartItems: filtered });
            },
            clearCart: () => set({ cartItems: [] }),

            // Address management
            address: null,
            setAddress: (address) => set({ address }),
            clearAddress: () => set({ address: null }),
        }),
        {
            name: "agri-store",
            storage: {
                getItem: async (name) => {
                    const value = await AsyncStorage.getItem(name);
                    return value ? JSON.parse(value) : null;
                },
                setItem: async (name, value) => {
                    await AsyncStorage.setItem(name, JSON.stringify(value));
                },
                removeItem: async (name) => {
                    await AsyncStorage.removeItem(name);
                },
            } as PersistStorage<{ address: Address }>,
            partialize: (state) => ({ address: state.address }),
        }
    )
);
