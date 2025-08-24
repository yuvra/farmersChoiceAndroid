import { useAgriStore } from "@/store/useAgriStore";
import { db } from "@/utils/firebaseConfig";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

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
	});

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

	const EmptyOrdersCard = ({
		name,
		phone,
	}: {
		name?: string;
		phone?: string;
	}) => {
		const cap = (s?: string) =>
			(s || "Friend")
				.trim()
				.toLowerCase()
				.replace(/(^|\s)\S/g, (t) => t.toUpperCase());

		return (
			<TouchableOpacity
				style={styles.emptyWrap}
				onPress={()=>{router.push("/")}}
				activeOpacity={1}
			>
				<View style={styles.emptyIconWrap}>
					<Text style={styles.emptyIcon}>🛒</Text>
				</View>

				<Text style={styles.emptyTitle}>Hey {cap(name)} 👋</Text>

				<Text style={styles.emptyBody}>
					Start exploring the agri store today!
				</Text>

				<View style={styles.shopBtn}>
					<Text style={styles.shopBtnText}>Shop Now</Text>
				</View>
			</TouchableOpacity>
		);
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
			{/* <Text style={styles.saveBanner}>Order History</Text> */}
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
								Status:{" "}
								<Text
									style={
										item.status === "Delivered"
											? {
													color: "#2e7d32",
													fontWeight: "600",
											  } // Green
											: item.status === "Cancelled"
											? {
													color: "#d32f2f",
													fontWeight: "600",
											  } // Red
											: {
													color: "#1e88e5",
													fontWeight: "600",
											  } // Default Blue
									}
								>
									{item.status}
								</Text>
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
					<EmptyOrdersCard
						name={profile?.name}
						phone={profile?.phone}
					/>
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
		// color: "#1e88e5",
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
	emptyWrap: {
		marginTop: 32,
		marginHorizontal: 16,
		backgroundColor: "#F4FBF5",
		borderRadius: 16,
		paddingVertical: 22,
		paddingHorizontal: 18,
		borderWidth: 1,
		borderColor: "#E1F2E3",
		alignItems: "center",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 3 },
		elevation: 2,
	},
	emptyIconWrap: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "#EAF7ED",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "#D8EEDD",
	},
	emptyIcon: { fontSize: 28 },
	emptyTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#1B5E20",
		textAlign: "center",
	},
	emptyPhone: { fontWeight: "800", color: "#2E7D32" },
	emptyBody: {
		fontSize: 14,
		color: "#4B5563",
		marginTop: 6,
		marginBottom: 14,
		textAlign: "center",
		fontFamily: "Poppoins",
	},
	shopBtn: {
		backgroundColor: "#2E7D32",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 999,
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	shopBtnText: {
		color: "#fff",
		fontWeight: "800",
		fontSize: 14,
	},
});
