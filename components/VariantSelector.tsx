import React, { useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet, ScrollView } from "react-native";

interface Variant {
  compareAtPrice: number;
  inventoryQuantity: number;
  price: number;
  title: { en: string; mr?: string; hi?: string };
  discountPercent?: number;
  showVariant?: boolean;
}

const makeKey = (v: Variant) =>
  `${v?.title?.en ?? ""}|${Number(v?.price) || 0}|${Number(v?.compareAtPrice) || 0}`;

export default function VariantSelector({
  variants,
  onVariantSelect,
  selectedVariant,
}: {
  variants: Variant[];
  onVariantSelect: (variant: Variant) => void;
  selectedVariant: Variant | null;
}) {
  // Work ONLY with visible variants everywhere
  const visible = useMemo(
    () => (Array.isArray(variants) ? variants.filter(v => v?.showVariant) : []),
    [variants]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Sync selectedIndex whenever selectedVariant or visible changes
  useEffect(() => {
    if (!selectedVariant || visible.length === 0) {
      setSelectedIndex(0);
      return;
    }
    const targetKey = makeKey(selectedVariant);
    const i = visible.findIndex(v => makeKey(v) === targetKey);
    setSelectedIndex(i >= 0 ? i : 0);
  }, [selectedVariant, visible]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    onVariantSelect(visible[index]); // ✅ select from the filtered list
  };

  if (visible.length === 0) {
    return (
      <View style={{ padding: 10 }}>
        <Text style={{ color: "#777" }}>No variants available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {visible.map((variant, index) => {
          const isSelected = index === selectedIndex;
          const saved =
            Number(variant?.compareAtPrice || 0) - Number(variant?.price || 0);
          const discountPct =
            variant?.compareAtPrice
              ? Math.max(0, Math.round((saved / variant.compareAtPrice) * 100))
              : 0;

          return (
            <TouchableOpacity
              key={makeKey(variant)} // stable composite key
              onPress={() => handleSelect(index)}
              style={[styles.card, isSelected && styles.selectedCard]}
            >
              {discountPct > 0 && (
                <View style={styles.discountTag}>
                  <Text style={styles.discountText}>{discountPct}% OFF</Text>
                </View>
              )}
              <Text style={styles.sizeText}>{variant?.title?.en}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{variant?.price}</Text>
                {variant?.compareAtPrice ? (
                  <Text style={styles.compareAt}>₹{variant?.compareAtPrice}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10, paddingLeft: 10 },
  card: {
    width: 120,
    marginRight: 12,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  selectedCard: {
    backgroundColor: "#e8f5e9",
    borderColor: "#4caf50",
    borderWidth: 2,
  },
  discountTag: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#FFA726",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 10,
  },
  discountText: { fontSize: 10, color: "#fff", fontWeight: "bold" },
  sizeText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
    paddingTop: 15,
  },
  priceRow: { flexDirection: "row", alignItems: "center" },
  price: { fontSize: 14, fontWeight: "bold", color: "#000", marginRight: 4 },
  compareAt: { fontSize: 12, color: "#999", textDecorationLine: "line-through" },
});
