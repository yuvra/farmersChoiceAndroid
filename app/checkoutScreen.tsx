import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ToastAndroid,
    Animated,
    Easing,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAgriStore } from "@/store/useAgriStore";
import { db } from "@/utils/firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

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

    const [expanded, setExpanded] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState("COD");

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(tractorAnim, {
                    toValue: 5, // move right
                    duration: 500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(tractorAnim, {
                    toValue: -50, // move left
                    duration: 2000, // longer time for longer distance
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        ).start();
    }, []);

    const handleMakePayment = async () => {
        if (!userPhone || !address || cartItems.length === 0) return;

        const newOrder = {
            id: Date.now().toString(),
            status: "Processing your order",
            items: cartItems,
            totalAmount: netPrice,
            paymentMethod: selectedPayment,
            createdAt: new Date().toISOString(),
        };

        try {
            const userDocRef = doc(db, "userProfilesAndOrderStatus", userPhone);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                await updateDoc(userDocRef, {
                    orders: arrayUnion(newOrder),
                });
            } else {
                ToastAndroid.showWithGravity(
                    "User profile not found",
                    ToastAndroid.SHORT,
                    ToastAndroid.TOP
                );
                return;
            }

            ToastAndroid.showWithGravity(
                "Order placed successfully!",
                ToastAndroid.SHORT,
                ToastAndroid.TOP
            );
            clearCart();
            router.push("/orderSucess");
        } catch (error) {
            ToastAndroid.showWithGravity(
                "Failed to place order",
                ToastAndroid.SHORT,
                ToastAndroid.TOP
            );
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push("/cart")}>
                    <AntDesign name="close" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Checkout</Text>
            </View>

            <ScrollView contentContainerStyle={styles.body}>
                {/* Address */}
                {address ? (
                    <View style={styles.addressContainer}>
                        <Text style={styles.label}>Deliver to:</Text>
                        {[
                            "name",
                            "phone",
                            "flat",
                            "street",
                            "city",
                            "district",
                            "state",
                            "pincode",
                            "landmark",
                            "country",
                        ].map(
                            (key, idx) =>
                                address[key] && (
                                    <Text key={idx} style={styles.address}>
                                        <Text>
                                            {key.charAt(0).toUpperCase() +
                                                key.slice(1)}
                                            :
                                        </Text>{" "}
                                        {address[key]}
                                    </Text>
                                )
                        )}
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.addAddressBtn}
                        onPress={() => router.push("/profile")}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <Animated.Text
                                style={{
                                    transform: [{ translateX: tractorAnim }],
                                    fontSize: 16,
                                }}
                            >
                                🚜📦
                            </Animated.Text>
                            <Text style={styles.addAddressText}>
                                {"   "}
                                Add Delivery Address
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}

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
                            <Text style={styles.priceLabel}>Net Price</Text>
                            <Text style={styles.price}>
                                ₹{netPrice.toFixed(2)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Order Summary Collapsible */}
                <TouchableOpacity onPress={() => setExpanded((prev) => !prev)}>
                    <Text style={styles.sectionTitle}>
                        Order Summary {expanded ? "▲" : "▼"}
                    </Text>
                </TouchableOpacity>
                {expanded && (
                    <View>
                        {cartItems.map((item) => (
                            <View
                                key={
                                    item.product.productId +
                                    item.variant.title.en
                                }
                                style={styles.itemCard}
                            >
                                <Image
                                    source={{
                                        uri: item.product.productImages[0],
                                    }}
                                    style={styles.image}
                                />
                                <View style={styles.details}>
                                    <Text style={styles.brand}>
                                        {item.product.vendor}
                                    </Text>
                                    <Text style={styles.title}>
                                        {item.product.productName.en}
                                    </Text>
                                    <Text style={styles.variant}>
                                        Size: {item.variant.title.en}
                                    </Text>
                                    <Text>
                                        ₹{item.variant.price} × {item.quantity}
                                    </Text>
                                </View>
                                {/* <Image
                                    source={require("../assets/images/genunin.png")}
                                    style={{ width: 40, height: 40, opacity: 0.8 }}
                                /> */}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <View>
                    <Text style={styles.total}>
                        ₹
                        {selectedPayment === "online"
                            ? (netPrice - 14).toFixed(2)
                            : netPrice.toFixed(2)}
                    </Text>
                    <Text style={styles.subtext}>Net Price</Text>
                </View>
                <TouchableOpacity
                    disabled={!address}
                    style={[
                        styles.makePaymentBtn,
                        !address && { opacity: 0.5 },
                    ]}
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
    header: {
        padding: 16,
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 40, // for status bar
    },
    headerText: {
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 12,
        fontFamily: "Poppins",
    },
    body: {
        padding: 16,
    },
    addressContainer: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
    },
    label: {
        fontWeight: "bold",
        fontSize: 16,
        fontFamily: "Poppins",
    },
    address: {
        fontSize: 14,
        color: "#555",
        fontFamily: "Poppins",
    },
    addAddressBtn: {
        backgroundColor: "#4caf50",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
    },
    addAddressText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        fontFamily: "Poppins",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginVertical: 10,
        fontFamily: "Poppins",
    },
    paymentOptionContainer: {
        gap: 12,
    },
    paymentOption: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    selectedOption: {
        backgroundColor: "#e8f5e9",
        borderColor: "#4caf50",
    },
    paymentText: {
        fontSize: 16,
        fontWeight: "600",
        fontFamily: "Poppins",
    },
    priceLabel: {
        fontSize: 12,
        color: "#666",
        fontFamily: "Poppins",
    },
    price: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "right",
        fontFamily: "Poppins",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderTopWidth: 1,
        borderColor: "#eee",
    },
    total: {
        fontSize: 18,
        fontWeight: "bold",
        fontFamily: "Poppins",
    },
    subtext: {
        fontSize: 12,
        color: "#555",
        fontFamily: "Poppins",
    },
    makePaymentBtn: {
        backgroundColor: "#4caf50",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    makePaymentText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        fontFamily: "Poppins",
    },
    itemCard: {
        flexDirection: "row",
        marginVertical: 8,
        alignItems: "center",
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    details: {
        flex: 1,
    },
    brand: {
        fontSize: 12,
        color: "#777",
        fontFamily: "Poppins",
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
        fontFamily: "Poppins",
    },
    variant: {
        fontSize: 13,
        color: "#444",
        marginTop: 2,
        fontFamily: "Poppins",
    },
});
