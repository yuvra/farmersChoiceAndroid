import { useAgriStore } from "@/store/useAgriStore";
import { db } from "@/utils/firebaseConfig";
import { AntDesign } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	Animated,
	Easing,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	ToastAndroid,
	TouchableOpacity,
	View,
} from "react-native";

const FREE_SHIPPING_THRESHOLD = 2000;

/* ---- helpers: weight parsing (kg, g, gm, gms, ml supported) ---- */
const parseWeightToGrams = (label: string): number => {
  const normalized = (label || "").toLowerCase().replace(/\s+/g, "");
  const match = normalized.match(/([\d.]+)\s*(kg|g|gm|gms|ml)/);
  if (!match) return 1000;

  const value = parseFloat(match[1]);
  const unit = match[2];

  if (isNaN(value)) return 1000;
  if (unit === "kg") return Math.round(value * 1000);
  // treat ml ≈ g (water-like density)
  return Math.round(value);
};

export default function CheckoutScreen() {
  const router = useRouter();
  const address = useAgriStore((s: any) => s.address);
  const cartItems = useAgriStore((s) => s.cartItems);
  const clearCart = useAgriStore((s) => s.clearCart);
  const userPhone = address?.phone;

  const tractorAnim = useRef(new Animated.Value(0)).current;

  const netPrice = cartItems.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  );

  const totalWeightGrams = useMemo(
    () =>
      cartItems.reduce((grams, item) => {
        const sizeLabel = item?.variant?.title?.en || "";
        const perUnit = parseWeightToGrams(sizeLabel);
        return grams + perUnit * (item.quantity || 1);
      }, 0),
    [cartItems]
  );

  const [expanded, setExpanded] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState("cod");

  // shipping state
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shipLoading, setShipLoading] = useState(false);
  const [hasEstimate, setHasEstimate] = useState(false);

  // screen overlay loader
  const [screenLoading, setScreenLoading] = useState(true);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(tractorAnim, {
          toValue: 5,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(tractorAnim, {
          toValue: -50,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  /* ---- shipping estimate: reusable ---- */
  const fetchEstimate = useCallback(async () => {
    const pincode = (address?.pincode || "").toString().trim();
    if (!pincode || totalWeightGrams <= 0) {
      setHasEstimate(false);
      setShippingCost(0);
      return;
    }
    try {
      setShipLoading(true);
      const body = {
        to_pincode: pincode,
        weight_grams: totalWeightGrams,
        payment_type: "Pre-paid",
      };
      const res = await fetch(
        "https://farmers-choice-admin.vercel.app/api/v1/shipping/estimate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      const amount = Number(json?.raw?.[0]?.gross_amount ?? 0);
      if (Number.isFinite(amount) && amount >= 0) {
        setShippingCost(amount);
        setHasEstimate(true);
      } else {
        setShippingCost(0);
        setHasEstimate(false);
      }
    } catch {
      setShippingCost(0);
      setHasEstimate(false);
    } finally {
      setShipLoading(false);
    }
  }, [address?.pincode, totalWeightGrams]);

  /* ALWAYS on screen focus: show overlay, fetch estimate, hide overlay */
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setScreenLoading(true);
        await fetchEstimate();
        if (active) setScreenLoading(false);
      })();
      return () => {
        active = false;
        setScreenLoading(true); // show loader next visit
      };
    }, [fetchEstimate])
  );

  /* Also refresh when pincode/cart change (no overlay) */
  useEffect(() => {
    fetchEstimate();
  }, [fetchEstimate]);

  const handleMakePayment = async () => {
    if (!userPhone || !address || cartItems.length === 0) return;

    const newOrder = {
      id: Date.now().toString(),
      status: "Processing your order",
      items: cartItems,
      totalAmount: netPrice,
      shippingAmount: netPrice < FREE_SHIPPING_THRESHOLD ? shippingCost : 0,
      paymentMethod: selectedPayment,
      createdAt: new Date().toISOString(),
    };

    try {
      const userDocRef = doc(db, "userProfilesAndOrderStatus", userPhone);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        await updateDoc(userDocRef, { orders: arrayUnion(newOrder) });
      } else {
        ToastAndroid.show("User profile not found", ToastAndroid.SHORT);
        return;
      }

      ToastAndroid.show("Order placed successfully!", ToastAndroid.SHORT);
      clearCart();
      router.push("/orderSucess");
    } catch {
      ToastAndroid.show("Failed to place order", ToastAndroid.SHORT);
    }
  };

  const payable =
    netPrice + (netPrice < FREE_SHIPPING_THRESHOLD ? shippingCost : 0);

  /* ---- Short UX messages ---- */
  const shortMessage =
    netPrice < FREE_SHIPPING_THRESHOLD
      ? `Add ₹${Math.max(0, FREE_SHIPPING_THRESHOLD - Math.floor(netPrice))} more for Free Shipping`
      : hasEstimate
      ? `You saved ₹${Math.floor(shippingCost)} with Free Shipping`
      : "Free Shipping applied";

  return (
    <View style={styles.container}>
      {/* Full-screen overlay loader on enter */}
      {screenLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/cart")}>
          <AntDesign name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Address */}
        {address ? (
           <View style={styles.addrCard}>
    <View style={styles.addrHeader}>
      <Text style={styles.addrTitle}>Deliver to</Text>

      {/* optional: quick edit */}
      <TouchableOpacity onPress={() => router.push("/profile")}>
        <Text style={styles.addrChange}>Change</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.addrRowTop}>
      <Text style={styles.addrName} numberOfLines={1}>{address.name}</Text>
      <Text style={styles.addrPhone} numberOfLines={1}>+91 {address.phone}</Text>
    </View>

    <Text style={styles.addrLine} numberOfLines={2}>
      {[address.flat, address.street, address.city, address.district, address.state, address.pincode, address.country]
        .filter(Boolean)
        .join(", ")}
    </Text>
  </View>
        ) : (
          <TouchableOpacity
            style={styles.addAddressBtn}
            onPress={() => router.push("/profile")}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Animated.Text
                style={{ transform: [{ translateX: tractorAnim }], fontSize: 16 }}
              >
                🚜📦
              </Animated.Text>
              <Text style={styles.addAddressText}>{"   "}Add Delivery Address</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Shipping cost & short message */}
        {hasEstimate && (
          <View style={styles.shipBadge}>
            <Text style={styles.shipBadgeText}>
              Shipping Cost: ₹{shippingCost.toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.infoPill}>
          <Text style={styles.infoPillText}>{shortMessage}</Text>
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        <View style={styles.paymentOptionContainer}>
          <TouchableOpacity
            onPress={() => setSelectedPayment("cod")}
            style={[
              styles.paymentOption,
              selectedPayment === "cod" && styles.selectedOption,
            ]}
          >
            <Text style={styles.paymentText}>Cash On Delivery</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.price}>
                ₹{(netPrice + (netPrice < FREE_SHIPPING_THRESHOLD ? shippingCost : 0)).toFixed(2)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <TouchableOpacity onPress={() => setExpanded((p) => !p)}>
          <Text style={styles.sectionTitle}>
            Order Summary {expanded ? "▲" : "▼"}
          </Text>
        </TouchableOpacity>
        {expanded && (
          <View>
            {cartItems.map((item) => (
              <View
                key={item.product.productId + item.variant.title.en}
                style={styles.itemCard}
              >
                <Image
                  source={{ uri: item.product.productImages[0] }}
                  style={styles.image}
                />
                <View style={styles.details}>
                  <Text style={styles.brand}>{item.product.vendor}</Text>
                  <Text style={styles.title}>{item.product.productName.en}</Text>
                  <Text style={styles.variant}>Size: {item.variant.title.en}</Text>
                  <Text>₹{item.variant.price} × {item.quantity}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.total}>₹{payable.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          disabled={!address}
          style={[styles.makePaymentBtn, !address && { opacity: 0.5 }]}
          onPress={handleMakePayment}
        >
          <Text style={styles.makePaymentText}>Make Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  /* Full-screen overlay loader */
  overlay: {
    position: "absolute",
    zIndex: 99,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    marginTop: 10,
    color: "#1b5e20",
    fontWeight: "700",
  },

  header: {
    padding: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 40,
  },
  headerText: { fontSize: 18, fontWeight: "bold", marginLeft: 12, fontFamily: "Poppins" },
  body: { padding: 16 },

  addressContainer: { marginBottom: 16, padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8 },
  label: { fontWeight: "bold", fontSize: 16, fontFamily: "Poppins" },
  address: { fontSize: 14, color: "#555", fontFamily: "Poppins" },
  addAddressBtn: {
    backgroundColor: "#4caf50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  addAddressText: { color: "#fff", fontSize: 16, fontWeight: "bold", fontFamily: "Poppins" },

  /* Shipping pill badge */
  shipBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#CDE8D2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginTop: 12,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  shipBadgeText: { color: "#1B5E20", fontWeight: "800" },

  /* Short message pill */
  infoPill: {
    alignSelf: "flex-start",
    backgroundColor: "#F4FBF5",
    borderWidth: 1,
    borderColor: "#E3F2E6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 8,
  },
  infoPillText: { color: "#2E7D32", fontWeight: "700" },

  sectionTitle: { fontSize: 16, fontWeight: "bold", marginVertical: 10, fontFamily: "Poppins" },
  paymentOptionContainer: { gap: 12 },
  paymentOption: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedOption: { backgroundColor: "#e8f5e9", borderColor: "#4caf50" },
  paymentText: { fontSize: 16, fontWeight: "600", fontFamily: "Poppins" },
  priceLabel: { fontSize: 12, color: "#666", fontFamily: "Poppins" },
  price: { fontSize: 16, fontWeight: "bold", textAlign: "right", fontFamily: "Poppins" },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  total: { fontSize: 18, fontWeight: "bold", fontFamily: "Poppins" },
  makePaymentBtn: { backgroundColor: "#4caf50", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  makePaymentText: { color: "#fff", fontSize: 16, fontWeight: "600", fontFamily: "Poppins" },

  itemCard: { flexDirection: "row", marginVertical: 8, alignItems: "center" },
  image: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  details: { flex: 1 },
  brand: { fontSize: 12, color: "#777", fontFamily: "Poppins" },
  title: { fontSize: 14, fontWeight: "600", fontFamily: "Poppins" },
  variant: { fontSize: 13, color: "#444", marginTop: 2, fontFamily: "Poppins" },
  addrCard: {
  backgroundColor: "#F8FAF9",
  borderWidth: 1,
  borderColor: "#E4EFE7",
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,        // tighter padding
  marginBottom: 14,
  shadowColor: "#000",
  shadowOpacity: 0.04,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
},
addrHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 6,
},
addrTitle: { fontSize: 16, fontWeight: "800", color: "#1B5E20" },
addrChange: { color: "#2E7D32", fontWeight: "700", fontSize: 12 },

addrRowTop: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 2,
},
addrName: { fontSize: 14.5, fontWeight: "700", color: "#111", flex: 1, paddingRight: 8 },
addrPhone: { fontSize: 13, fontWeight: "600", color: "#374151" },

addrLine: {
  fontSize: 13,
  color: "#4B5563",
  lineHeight: 18,
},
});
