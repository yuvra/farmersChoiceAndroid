import React, { useEffect, useMemo, useState } from "react";
import { ToastAndroid } from "react-native";
import * as Haptics from "expo-haptics";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from "react-native";
import { useNavigation, useLocalSearchParams, useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import ProductCarousel from "@/components/ProductCarousel";
import ProductDescription from "@/components/ProductDescription";
import VariantSelector from "@/components/VariantSelector";
import { useAgriStore } from "@/store/useAgriStore";

const { width } = Dimensions.get("window");

export default function ProductDetails() {
    const navigation = useNavigation();
    const { product } = useLocalSearchParams();
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const addToCart = useAgriStore((s) => s.addToCart);
    const router = useRouter();

    // ✅ Parse product safely
    const parsedProduct = useMemo(() => {
        try {
            return product ? JSON.parse(product as string) : null;
        } catch (err) {
            console.error("Invalid product data", err);
            return null;
        }
    }, [product]);

    // ✅ Set first variant every time the product changes
    useEffect(() => {
        const variants = parsedProduct?.mapVariant;
        if (Array.isArray(variants) && variants.length > 0) {
            setSelectedVariant(variants[0]);
        } else {
            setSelectedVariant(null);
        }
    }, [product]);

    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <AntDesign name="arrowleft" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Details</Text>
            </View>

            {/* Scrollable Body */}
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <View style={styles.carouselContainer}>
                    <ProductCarousel
                        images={parsedProduct?.productImages || []}
                    />
                </View>

                <Text style={styles.farmersText}>
                    90+ Farmers have ordered recently
                </Text>

                <Text style={styles.brand}>
                    {parsedProduct?.productName?.en || "Product Name"}
                </Text>

                {/* Price */}
                <View style={styles.priceSection}>
                    <Text style={styles.price}>₹{selectedVariant?.price}</Text>
                    <Text style={styles.oldPrice}>
                        ₹{selectedVariant?.compareAtPrice}
                    </Text>
                </View>

                <Text style={styles.saved}>
                    Saved Price ₹
                    {selectedVariant?.compareAtPrice - selectedVariant?.price ||
                        0}
                </Text>

                {/* Variant Selector */}
                <VariantSelector
                    variants={parsedProduct?.mapVariant || []}
                    onVariantSelect={(variant) => setSelectedVariant(variant)}
                    selectedVariant={selectedVariant}
                />

                {/* Description */}
                <ProductDescription
                    html={parsedProduct?.productDescription?.en || ""}
                />
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => {
                        if (parsedProduct && selectedVariant) {
                            addToCart(parsedProduct, selectedVariant);
                            // router.push("/cart");
                            ToastAndroid.show(
                                "Added to cart",
                                ToastAndroid.SHORT
                            );
                        }
                    }}
                >
                    <Text style={styles.buttonText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.buyButton}
                    onPress={() => {
                        if (parsedProduct && selectedVariant) {
                            // addToCart(parsedProduct, selectedVariant);
                            router.push("/cart");
                        }
                    }}
                >
                    <Text style={styles.buttonText}>Buy Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#f5f5f5",
        borderBottomWidth: 1,
        borderColor: "#ddd",
        paddingTop: 40, // to avoid overlap with status bar
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 12,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    carouselContainer: {
        marginBottom: 10,
    },
    farmersText: {
        marginTop: 12,
        color: "#388e3c",
        fontWeight: "600",
        fontSize: 14,
    },
    brand: {
        fontSize: 14,
        color: "#777",
        marginBottom: 10,
    },
    priceSection: {
        flexDirection: "row",
        alignItems: "center",
    },
    price: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
        marginRight: 8,
    },
    oldPrice: {
        fontSize: 16,
        color: "#888",
        textDecorationLine: "line-through",
    },
    saved: {
        color: "#2e7d32",
        fontSize: 14,
        marginVertical: 5,
    },
    bottomBar: {
        position: "absolute",
        bottom: 0,
        flexDirection: "row",
        width: "100%",
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderColor: "#ccc",
    },
    cartButton: {
        flex: 1,
        backgroundColor: "#ffa000",
        paddingVertical: 16,
        alignItems: "center",
    },
    buyButton: {
        flex: 1,
        backgroundColor: "#388e3c",
        paddingVertical: 16,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
});
