import React, { useEffect, useState } from "react";
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    ScrollView,
} from "react-native";

interface Variant {
    compareAtPrice: number;
    inventoryQuantity: number;
    price: number;
    title: {
        en: string;
        mr?: string;
        hi?: string;
    };
    discountPercent?: number;
}

export default function VariantSelector({
    variants,
    onVariantSelect,
    selectedVariant,
}: {
    variants: Variant[];
    onVariantSelect: (variant: Variant) => void;
    selectedVariant: any;
}) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (selectedVariant) {
            const foundIndex = variants.findIndex(
                (v) => JSON.stringify(v) === JSON.stringify(selectedVariant)
            );
            if (foundIndex >= 0) {
                setSelectedIndex(foundIndex);
            }
        }
    }, [selectedVariant, variants]);

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
        onVariantSelect(variants[index]);
    };

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {variants
                    .filter((variant: any) => variant?.showVariant)
                    .map((variant, index) => {
                        const isSelected = index === selectedIndex;
                        const saved =
                            variant.compareAtPrice && variant.price
                                ? variant.compareAtPrice - variant.price
                                : 0;

                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleSelect(index)}
                                style={[
                                    styles.card,
                                    isSelected && styles.selectedCard,
                                ]}
                            >
                                {saved > 0 && (
                                    <View style={styles.discountTag}>
                                        <Text style={styles.discountText}>
                                            {Math.round(
                                                (saved /
                                                    variant.compareAtPrice) *
                                                    100
                                            )}
                                            % OFF
                                        </Text>
                                    </View>
                                )}
                                <Text style={styles.sizeText}>
                                    {variant.title.en}
                                </Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.price}>
                                        ₹{variant.price}
                                    </Text>
                                    <Text style={styles.compareAt}>
                                        ₹{variant.compareAtPrice}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        paddingLeft: 10,
    },
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
    discountText: {
        fontSize: 10,
        color: "#fff",
        fontWeight: "bold",
    },
    sizeText: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
        color: "#333",
        textAlign: "center",
        paddingTop: 15,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    price: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#000",
        marginRight: 4,
    },
    compareAt: {
        fontSize: 12,
        color: "#999",
        textDecorationLine: "line-through",
    },
});
