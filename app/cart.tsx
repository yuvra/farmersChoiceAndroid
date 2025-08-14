import React, { useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, Platform,
} from "react-native";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAgriStore } from "@/store/useAgriStore";

const { width } = Dimensions.get("window");
const IS_TABLET = width >= 768;
const CARD_RADIUS = 14;

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);

export default function CartScreen() {
  const router = useRouter();
  const cartItems = useAgriStore((s) => s.cartItems);
  const updateQty = useAgriStore((s) => s.updateCartItemQty);
  const removeFromCart = useAgriStore((s) => s.removeFromCart);

  const { netPrice, totalSavings } = useMemo(() => {
    let total = 0;
    let saved = 0;
    for (const item of cartItems) {
      const p = Number(item.variant.price) || 0;
      const mrp = Number(item.variant.compareAtPrice) || 0;
      const q = Number(item.quantity) || 0;
      total += p * q;
      if (mrp > p) saved += (mrp - p) * q;
    }
    return { netPrice: total, totalSavings: saved };
  }, [cartItems]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <AntDesign name="arrowleft" size={IS_TABLET ? 24 : 22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Your Cart</Text>
        <View style={{ width: IS_TABLET ? 24 : 22 }} />
      </View>

      {/* List */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.product.productId + item.variant.title.en}
        contentContainerStyle={[
          styles.listContent,
          cartItems.length === 0 && { flexGrow: 1, justifyContent: "center" },
        ]}
        renderItem={({ item }) => {
          const price = Number(item.variant.price) || 0;
          const mrp = Number(item.variant.compareAtPrice) || 0;
          const qty = Number(item.quantity) || 0;
          const hasCompare = mrp > price;
          const savePerUnit = hasCompare ? mrp - price : 0;
          const lineTotal = price * qty;
          const pct =
            hasCompare && mrp > 0
              ? Math.max(0, Math.round(((mrp - price) / mrp) * 100))
              : 0;

          return (
            <View style={styles.cardWrap}>
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <Image
                    source={{ uri: item.product.productImages?.[0] }}
                    style={styles.image}
                  />
                  {pct > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{pct}% OFF</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardMid}>
                  <Text style={styles.brand}>{item.product.vendor}</Text>
                  <Text numberOfLines={2} style={styles.title}>
                    {item.product.productName.en}
                  </Text>

                  <View style={styles.priceRowWrap}>
                    <Text style={styles.unitPrice}>
                      {formatINR(price)}
                      <Text style={styles.perUnit}> / unit</Text>
                    </Text>
                    {hasCompare && (
                      <Text style={styles.compareAt}>{formatINR(mrp)}</Text>
                    )}
                  </View>

                  <Text style={styles.sizeText}>Size: {item.variant.title.en}</Text>

                  <View style={styles.lineTotalRow}>
                    <Text style={styles.lineTotalLabel}>Item total</Text>
                    <Text style={styles.lineTotalValue}>{formatINR(lineTotal)}</Text>
                  </View>

                  {hasCompare && (
                    <Text style={styles.savingsText}>
                      You save {formatINR(savePerUnit * qty)}
                    </Text>
                  )}
                </View>

                <View style={styles.cardRight}>
                  <View style={styles.stepper}>
                    {qty <= 1 ? (
                      <TouchableOpacity
                        onPress={() =>
                          removeFromCart(item.product.productId, item.variant.title.en)
                        }
                        style={[styles.stepBtn, styles.deleteBtn]}
                        accessibilityLabel="Remove from cart"
                      >
                        <MaterialIcons name="delete" size={IS_TABLET ? 20 : 18} color="#fff" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() =>
                          updateQty(
                            item.product.productId,
                            item.variant.title.en,
                            Math.max(1, qty - 1)
                          )
                        }
                        style={styles.stepBtn}
                        accessibilityLabel="Decrease quantity"
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                    )}

                    <Text style={styles.qtyText}>{qty}</Text>

                    <TouchableOpacity
                      onPress={() =>
                        updateQty(
                          item.product.productId,
                          item.variant.title.en,
                          qty + 1
                        )
                      }
                      style={styles.stepBtn}
                      accessibilityLabel="Increase quantity"
                    >
                      <Text style={styles.stepBtnText}>＋</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCard}>
              <AntDesign
                name="shoppingcart"
                size={IS_TABLET ? 48 : 40}
                color="#4caf50"
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptySub}>Add items to continue shopping.</Text>
              <TouchableOpacity onPress={() => router.push("/")} style={styles.shopNowBtn}>
                <Text style={styles.shopNowText}>Go to Store</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />

      {/* Footer */}
      <View style={[styles.footer, Platform.OS === "android" && { paddingBottom: 14 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.total}>{formatINR(netPrice)}</Text>
          <Text style={styles.subtext}>
            Net Price{totalSavings > 0 ? ` • You save ${formatINR(totalSavings)}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.proceedBtn, cartItems.length === 0 && styles.proceedBtnDisabled]}
          onPress={() => router.push("/checkoutScreen")}
          disabled={cartItems.length === 0}
        >
          <Text style={styles.proceedText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fb" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 42,
    paddingBottom: 12,
    backgroundColor: "#4caf50",
    justifyContent: "space-between",
  },
  backBtn: {
    width: IS_TABLET ? 36 : 32,
    height: IS_TABLET ? 36 : 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: IS_TABLET ? 20 : 18,
    fontWeight: "700",
    color: "#fff",
  },

  listContent: { padding: IS_TABLET ? 16 : 12, paddingBottom: 120 },

  cardWrap: {
    width: "100%",
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: CARD_RADIUS,
    padding: IS_TABLET ? 14 : 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    width: "100%",
    maxWidth: IS_TABLET ? 700 : undefined, // center nicer on tablets
  },

  cardLeft: { marginRight: 12 },
  image: {
    width: IS_TABLET ? 84 : 74,
    height: IS_TABLET ? 84 : 74,
    borderRadius: 10,
    backgroundColor: "#eef2f5",
    borderWidth: 1,
    borderColor: "#eef2f5",
  },
  badge: {
    position: "absolute",
    bottom: -6,
    left: 0,
    backgroundColor: "#FFA726",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    elevation: 2,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 11 },

  cardMid: { flex: 1 },
  brand: { fontSize: IS_TABLET ? 13 : 12, color: "#6b7280" },
  title: {
    fontSize: IS_TABLET ? 16 : 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },

  priceRowWrap: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  unitPrice: { fontSize: IS_TABLET ? 16 : 15, fontWeight: "700", color: "#1b1b1b" },
  perUnit: { fontSize: IS_TABLET ? 13 : 12, color: "#6b7280", fontWeight: "400" },
  compareAt: {
    fontSize: IS_TABLET ? 13 : 12,
    color: "#9ca3af",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },

  sizeText: { marginTop: 2, color: "#374151", fontSize: IS_TABLET ? 13 : 12 },

  lineTotalRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lineTotalLabel: { color: "#6b7280", fontSize: IS_TABLET ? 13 : 12 },
  lineTotalValue: { fontSize: IS_TABLET ? 17 : 16, fontWeight: "800", color: "#2e7d32" },
  savingsText: { marginTop: 2, color: "#2e7d32", fontSize: IS_TABLET ? 13 : 12, fontWeight: "600" },

  cardRight: { justifyContent: "center", alignItems: "flex-end", marginLeft: 8 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f6f9",
    borderRadius: 999,
    paddingHorizontal: IS_TABLET ? 8 : 6,
    paddingVertical: IS_TABLET ? 6 : 4,
    gap: IS_TABLET ? 8 : 6,
  },
  stepBtn: {
    width: IS_TABLET ? 32 : 28,
    height: IS_TABLET ? 32 : 28,
    borderRadius: 999,
    backgroundColor: "#4caf50",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: { backgroundColor: "#ef4444" },
  stepBtnText: { color: "#fff", fontSize: IS_TABLET ? 18 : 16, fontWeight: "800", lineHeight: IS_TABLET ? 18 : 16 },
  qtyText: { minWidth: IS_TABLET ? 22 : 18, textAlign: "center", fontWeight: "800", fontSize: IS_TABLET ? 15 : 14 },

  /* Empty */
  emptyWrap: { paddingHorizontal: 24 },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: CARD_RADIUS,
    padding: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    alignItems: "center",
  },
  emptyTitle: { fontSize: IS_TABLET ? 20 : 18, fontWeight: "800", color: "#111827" },
  emptySub: { fontSize: IS_TABLET ? 15 : 14, color: "#6b7280", marginTop: 4, marginBottom: 12 },
  shopNowBtn: { backgroundColor: "#4caf50", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  shopNowText: { color: "#fff", fontWeight: "800" },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#eef2f7",
  },
  total: { fontSize: IS_TABLET ? 22 : 20, fontWeight: "900", color: "#111827" },
  subtext: { fontSize: IS_TABLET ? 13 : 12, color: "#6b7280" },
  proceedBtn: { backgroundColor: "#4caf50", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  proceedText: { color: "#fff", fontWeight: "800", fontSize: IS_TABLET ? 16 : 15 },
  proceedBtnDisabled: { backgroundColor: "#cfd8dc" },
});
