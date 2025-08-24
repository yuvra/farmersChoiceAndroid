import { useAgriStore } from "@/store/useAgriStore";
import { db } from "@/utils/firebaseConfig";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

/* ---- helpers: weight parsing (kg, g, ml supported) ---- */
const parseWeightToGrams = (label: string): number => {
	const s = (label || "").toLowerCase().replace(/\s+/g, "");
	const m = s.match(/([\d.]+)\s*(kg|g|gm|gms|ml)/);
	if (!m) return 1000;
	const val = parseFloat(m[1]);
	const unit = m[2];
	if (isNaN(val)) return 1000;
	if (unit === "kg") return Math.round(val * 1000);
	// treat ml ~ g (water-like density)
	return Math.round(val);
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
			cartItems.reduce((g, item) => {
				const label = item?.variant?.title?.en || "";
				const perUnit = parseWeightToGrams(label);
				return g + perUnit * (item.quantity || 1);
			}, 0),
		[cartItems]
	);

	const [expanded, setExpanded] = useState(true);
	const [selectedPayment, setSelectedPayment] = useState("cod");

	// shipping state
	const [shippingCost, setShippingCost] = useState<number>(0);
	const [shipLoading, setShipLoading] = useState(false);
	const [hasEstimate, setHasEstimate] = useState(false); // controls UI

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
	const fetchEstimate = async () => {
		const pin = (address?.pincode || "").toString().trim();
		if (!pin || totalWeightGrams <= 0) {
			setHasEstimate(false);
			setShippingCost(0);
			return;
		}
		try {
			setShipLoading(true);
			const body = {
				to_pincode: pin,
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
				setHasEstimate(false); // hide UI on bad data
			}
		} catch {
			setShippingCost(0);
			setHasEstimate(false); // hide UI on failure
		} finally {
			setShipLoading(false);
		}
	};

	/* call ONCE on mount (always) */
	useEffect(() => {
		fetchEstimate(); // always on entering the page
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/* also refresh when pincode/cart change */
	useEffect(() => {
		fetchEstimate();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [address?.pincode, totalWeightGrams]);

	const handleMakePayment = async () => {
		if (!userPhone || !address || cartItems.length === 0) return;

		const newOrder = {
			id: Date.now().toString(),
			status: "Processing your order",
			items: cartItems,
			totalAmount: netPrice,
			shippingAmount: netPrice < 2000 ? shippingCost : 0,
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

	const payable = netPrice + (netPrice < 2000 ? shippingCost : 0);

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
								{"   "}Add Delivery Address
							</Text>
						</View>
					</TouchableOpacity>
				)}

				{/* Shipping badge (always fetched; show only if we have a valid estimate) */}
				{hasEstimate && (
					<View style={styles.shipBadge}>
						<Text style={styles.shipBadgeText}>
							Shipping Cost: ₹{shippingCost.toFixed(2)}
						</Text>
						{shipLoading && (
							<ActivityIndicator
								size="small"
								color="#1b5e20"
								style={{ marginLeft: 8 }}
							/>
						)}
					</View>
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
							<Text style={styles.priceLabel}>Total</Text>
							<Text style={styles.price}>
								₹
								{(
									netPrice +
									(netPrice < 2000 ? shippingCost : 0)
								).toFixed(2)}
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
		paddingTop: 40,
	},
	headerText: {
		fontSize: 18,
		fontWeight: "bold",
		marginLeft: 12,
		fontFamily: "Poppins",
	},
	body: { padding: 16 },
	addressContainer: {
		marginBottom: 16,
		padding: 12,
		backgroundColor: "#f9f9f9",
		borderRadius: 8,
	},
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
	addAddressText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
		fontFamily: "Poppins",
	},

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
		marginBottom: 2,
		flexDirection: "row",
		alignItems: "center",
	},
	shipBadgeText: { color: "#1B5E20", fontWeight: "800" },

	sectionTitle: {
		fontSize: 16,
		fontWeight: "bold",
		marginVertical: 10,
		fontFamily: "Poppins",
	},
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
	total: { fontSize: 18, fontWeight: "bold", fontFamily: "Poppins" },
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

	itemCard: { flexDirection: "row", marginVertical: 8, alignItems: "center" },
	image: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
	details: { flex: 1 },
	brand: { fontSize: 12, color: "#777", fontFamily: "Poppins" },
	title: { fontSize: 14, fontWeight: "600", fontFamily: "Poppins" },
	variant: {
		fontSize: 13,
		color: "#444",
		marginTop: 2,
		fontFamily: "Poppins",
	},
});
