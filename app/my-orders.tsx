import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { db } from "@/utils/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useAgriStore } from "@/store/useAgriStore";

export default function MyOrdersScreen() {
    const router = useRouter();
    const profile: any = useAgriStore((s) => s.address);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (profile?.phone) {
            fetchOrders();
        }
    },);

    const fetchOrders = async () => {
        try {
            const docRef = doc(db, "userProfilesAndOrderStatus", profile.phone);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const ordersWithId = (data.orders || []).map(
                    (order: any, index: any) => ({
                        ...order,
                        id: order.id || `order-${index}`,
                    })
                );
                setOrders(ordersWithId);
            } else {
                setOrders([]);
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    if (!profile?.phone) {
        return (
            <View style={styles.cardContainer}>
                <View style={styles.messageCard}>
                    <Text style={styles.messageTitle}>
                        Login to see your orders
                    </Text>
                    <Text style={styles.messageBody}>
                        You can go to the profile tab and login to view your
                        past orders.
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push("/profile")}
                    >
                        <Text style={styles.buttonText}>Go to Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#4caf50" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.saveBanner}>Order History</Text>
            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => {
                            setSelectedOrder(item);
                            setModalVisible(true);
                        }}
                        style={styles.itemCard}
                    >
                        <Image
                            source={{
                                uri:
                                    item.items[0]?.product?.productImages[0] ||
                                    "https://via.placeholder.com/50",
                            }}
                            style={styles.image}
                        />
                        <View style={styles.details}>
                            <Text style={styles.name} numberOfLines={1}>
                                {item.items[0]?.product?.productName?.en ||
                                    "Product Name"}
                            </Text>
                            <Text style={styles.date}>
                                Order Date:{" "}
                                {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                            <Text style={styles.status}>
                                Status: {item.status}
                            </Text>
                            <Text style={styles.amount}>
                                ₹{item.totalAmount || 0}
                            </Text>
                        </View>
                        {item.items.length > 1 && (
                            <View style={styles.qtyBubble}>
                                <Text style={styles.qtyText}>
                                    {item.items.length}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No orders found.</Text>
                }
                contentContainerStyle={{ padding: 16 }}
            />

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>Order Details</Text>
                            {selectedOrder?.items.map(
                                (item: any, index: number) => (
                                    <View
                                        key={index}
                                        style={styles.orderDetailBlock}
                                    >
                                        <Text style={styles.productName}>
                                            {item.product.productName.en}
                                        </Text>
                                        <Text>
                                            Vendor: {item.product.vendor}
                                        </Text>
                                        <Text>
                                            Size: {item.variant.title.en}
                                        </Text>
                                        <Text>Qty: {item.quantity}</Text>
                                        <Text>
                                            Price: ₹{item.variant.price}
                                        </Text>
                                        <Text>
                                            Total: ₹
                                            {item.variant.price * item.quantity}
                                        </Text>
                                    </View>
                                )
                            )}
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Close</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    saveBanner: {
        backgroundColor: "#1db954",
        color: "#fff",
        fontWeight: "bold",
        textAlign: "center",
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: "Poppins",
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    cardContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f6fff4",
        padding: 20,
    },
    messageCard: {
        backgroundColor: "#d0f0c0",
        borderRadius: 12,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        width: "90%",
    },
    messageTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#2e7d32",
        marginBottom: 8,
        textAlign: "center",
    },
    messageBody: {
        fontSize: 14,
        color: "#2e7d32",
        marginBottom: 16,
        textAlign: "center",
    },
    button: {
        backgroundColor: "#388e3c",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14,
    },
    itemCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: "#eee",
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    details: {
        flex: 1,
    },
    name: {
        fontSize: 14,
        fontWeight: "600",
        color: "#000",
        fontFamily: "Poppins",
    },
    date: {
        fontSize: 12,
        color: "#555",
        fontFamily: "Poppins",
    },
    status: {
        fontSize: 12,
        color: "#1e88e5",
        fontFamily: "Poppins",
    },
    amount: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#2e7d32",
        fontFamily: "Poppins",
        marginTop: 2,
    },
    qtyBubble: {
        backgroundColor: "#f2f2f2",
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    qtyText: {
        fontSize: 12,
        color: "#333",
        fontWeight: "bold",
        fontFamily: "Poppins",
    },
    emptyText: {
        textAlign: "center",
        marginTop: 20,
        fontSize: 14,
        color: "#999",
        fontFamily: "Poppins",
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        maxHeight: "80%",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
        fontFamily: "Poppins",
    },
    orderDetailBlock: {
        marginBottom: 16,
    },
    productName: {
        fontWeight: "bold",
        fontSize: 16,
        fontFamily: "Poppins",
    },
    closeButton: {
        backgroundColor: "#4caf50",
        padding: 12,
        alignItems: "center",
        borderRadius: 8,
    },
});
