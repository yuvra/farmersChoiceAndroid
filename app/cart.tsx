import React from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
} from "react-native";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAgriStore } from "@/store/useAgriStore";
import { useRouter } from "expo-router";

export default function CartScreen() {
    // const navigation = useNavigation();
    const router = useRouter();
    const cartItems = useAgriStore((s) => s.cartItems);
    const updateQty = useAgriStore((s) => s.updateCartItemQty);
    const removeFromCart = useAgriStore((s) => s.removeFromCart);

    const netPrice = cartItems.reduce(
        (sum, item) => sum + item.variant.price * item.quantity,
        0
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <AntDesign name="arrowleft" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Cart</Text>
            </View>

            {/* Cart List */}
            <FlatList
                data={cartItems}
                keyExtractor={(item) =>
                    item.product.productId + item.variant.title.en
                }
                renderItem={({ item }) => (
                    <View style={styles.itemCard}>
                        <Image
                            source={{ uri: item.product.productImages[0] }}
                            style={styles.image}
                        />
                        <View style={styles.details}>
                            <Text style={styles.brand}>
                                {item.product.vendor}
                            </Text>
                            <Text numberOfLines={1} style={styles.title}>
                                {item.product.productName.en}
                            </Text>
                            <Text style={styles.priceRow}>
                                Price ₹{item.variant.price}
                                <Text style={styles.compareAt}>
                                    {" "}
                                    ₹{item.variant.compareAtPrice}
                                </Text>
                            </Text>
                            <Text>Size {item.variant.title.en}</Text>
                        </View>
                        <View style={styles.qtyControls}>
                            {item.quantity === 1 ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        removeFromCart(
                                            item.product.productId,
                                            item.variant.title.en
                                        );
                                    }}
                                    style={styles.qtyBtn}
                                >
                                    <MaterialIcons
                                        name="delete"
                                        size={20}
                                        color="#f60c0cff"
                                    />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => {
                                        const qty = Math.max(
                                            0,
                                            item.quantity - 1
                                        );
                                        updateQty(
                                            item.product.productId,
                                            item.variant.title.en,
                                            qty
                                        );
                                    }}
                                    style={styles.qtyBtn}
                                >
                                    <Text style={styles.qtyBtnText}>-</Text>
                                </TouchableOpacity>
                            )}
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    updateQty(
                                        item.product.productId,
                                        item.variant.title.en,
                                        item.quantity + 1
                                    );
                                }}
                                style={styles.qtyBtn}
                            >
                                <Text style={styles.qtyBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={{ alignItems: "center", marginBottom: 8 }}>
                            <AntDesign
                                name="shoppingcart"
                                size={40}
                                color="#4caf50"
                            />
                        </View>
                        <Text style={styles.emptyText}>
                            Your cart is empty.
                        </Text>
                        <Text style={styles.emptySubtext}>
                            Please add items to continue shopping.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push("/")}
                            style={styles.shopNowBtn}
                        >
                            <Text style={styles.shopNowText}>Go to Store</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Footer */}
            <View style={styles.footer}>
                <View>
                    <Text style={styles.total}>₹{netPrice.toFixed(2)}</Text>
                    <Text style={styles.subtext}>Net Price</Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.proceedBtn,
                        cartItems.length === 0 && styles.proceedBtnDisabled,
                    ]}
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
    container: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#4caf50",
        paddingTop: 40, // for status bar
    },
    headerText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
        marginLeft: 12,
    },
    itemCard: {
        flexDirection: "row",
        padding: 12,
        borderBottomWidth: 1,
        borderColor: "#eee",
        alignItems: "center",
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 10,
    },
    details: {
        flex: 1,
    },
    brand: {
        fontSize: 12,
        color: "#777",
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
    },
    priceRow: {
        flexDirection: "row",
        color: "#000",
        fontSize: 14,
    },
    compareAt: {
        fontSize: 12,
        color: "#999",
        textDecorationLine: "line-through",
        marginLeft: 6,
    },
    qtyControls: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 8,
    },
    qtyBtn: {
        borderWidth: 1,
        borderColor: "#4caf50",
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    qtyBtnText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#4caf50",
    },
    qtyText: {
        marginHorizontal: 6,
        fontSize: 16,
        fontWeight: "bold",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 16,
        borderTopWidth: 1,
        borderColor: "#eee",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    total: {
        fontSize: 20,
        fontWeight: "bold",
    },
    subtext: {
        fontSize: 12,
        color: "#777",
    },
    proceedBtn: {
        backgroundColor: "#4caf50",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    proceedText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    proceedBtnDisabled: {
        backgroundColor: "#ccc", // gray out when disabled
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 6,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#666",
        marginBottom: 12,
    },
    shopNowBtn: {
        backgroundColor: "#4caf50",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
    },
    shopNowText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
});
