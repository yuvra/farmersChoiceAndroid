import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export default function ProductCard({ product }: any) {
	const router = useRouter();
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const [imgLoaded, setImgLoaded] = useState(false);
	const shimmerAnim = useRef(new Animated.Value(0)).current;

	// Separate animation for Out of Stock ribbon only
	const ribbonScaleAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.loop(
			Animated.timing(shimmerAnim, {
				toValue: 1,
				duration: 1000,
				useNativeDriver: true,
			})
		).start();
	}, []);

	const handlePress = () => {
		if (product.isOutOfStock) {
			Animated.sequence([
				Animated.timing(ribbonScaleAnim, {
					toValue: 1.3,
					duration: 150,
					useNativeDriver: true,
				}),
				Animated.timing(ribbonScaleAnim, {
					toValue: 1,
					duration: 150,
					useNativeDriver: true,
				}),
			]).start();
			return;
		}

		Animated.sequence([
			Animated.timing(scaleAnim, {
				toValue: 0.96,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(scaleAnim, {
				toValue: 1,
				duration: 50,
				useNativeDriver: true,
			}),
		]).start(() => {
			if (!product.isOutOfStock) {
				router.push({
					pathname: "/productDetails",
					params: { product: JSON.stringify(product) },
				});
			}
		});
	};

	console.log("***product", product);

	const findIsShowVariantItemIndexFormMapVariant = (variant: any) => {
		return variant.showVariant;
	};

	// Helper: pick the active variant once
	const getActiveVariant = (p: any) => {
		const mv = p?.mapVariant ?? [];
		if (!Array.isArray(mv) || mv.length === 0) return null;

		// showVariant can be boolean or string; treat truthy/"true" as active
		const idx = mv.findIndex(
			(v) => v?.showVariant === true || v?.showVariant === "true"
		);

		return mv[idx >= 0 ? idx : 0]; // fallback to first variant
	};

	// Memoize for this product
	const activeVariant = React.useMemo(
		() => getActiveVariant(product),
		[product]
	);

	// Then use everywhere
	const price = activeVariant?.price ?? 0;
	const compareAt = activeVariant?.compareAtPrice ?? undefined;
	const sizeTitle = activeVariant?.title?.en ?? "";

	return (
		<TouchableWithoutFeedback onPress={handlePress}>
			<Animated.View
				style={[styles.card, { transform: [{ scale: scaleAnim }] }]}
			>
				{/* <View style={styles.card}> */}
				{/* Category Ribbon */}
				{product.productType?.en && (
					<View style={styles.ribbonContainer}>
						<View style={styles.ribbon}>
							<Text style={styles.ribbonText}>
								{product.productType.en}
							</Text>
						</View>
					</View>
				)}

				{/* Discount Badge */}
				{product.discountPercent && (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>
							{product.discountPercent}% OFF
						</Text>
					</View>
				)}

				{/* Product Image */}
				{/* Image + skeleton */}
				<View style={styles.imageWrap}>
					{!imgLoaded && (
						<>
							{/* Gradient sweep */}
							<View style={styles.skeletonBase}>
								<AnimatedGradient
									colors={[
										"#E9ECEF00",
										"#FFFFFFAA",
										"#E9ECEF00",
									]}
									start={{ x: 0, y: 0.5 }}
									end={{ x: 1, y: 0.5 }}
									style={[
										styles.shimmer,
										{
											transform: [
												{
													translateX:
														shimmerAnim.interpolate(
															{
																inputRange: [
																	0, 1,
																],
																outputRange: [
																	-cardWidth,
																	cardWidth,
																], // long sweep
															}
														),
												},
											],
										},
									]}
								/>
							</View>

							{/* Below-image skeleton lines */}
							<View style={styles.textSkeletonArea}>
								<View
									style={[styles.skelLine, { width: "80%" }]}
								/>
								<View
									style={[
										styles.skelLine,
										{ width: "55%", marginTop: 6 },
									]}
								/>
								<View
									style={[
										styles.skelLineSm,
										{ width: "40%", marginTop: 8 },
									]}
								/>
							</View>
						</>
					)}

					<Image
						source={{ uri: product.productImages[0] }}
						style={styles.image}
						onLoad={() => setImgLoaded(true)}
					/>
				</View>

				{/* Product Name */}
				<Text style={styles.name} numberOfLines={1}>
					{product.productName.en}
				</Text>

				{/* Vendor */}
				<Text style={styles.vendor} numberOfLines={1}>
					{product.vendor}
				</Text>

				{/* Price */}
				<View style={styles.priceRow}>
					<Text style={styles.price}>
						{/* ₹{product.mapVariant[0].price} */}
						₹{price}
					</Text>
					<Text style={styles.strikePrice}>
						{/* ₹{product.mapVariant[0].compareAtPrice} */}
						{compareAt}
					</Text>
				</View>

				{/* Saved Price */}
				<Text style={styles.savedPrice}>
					💰 Saved ₹{compareAt - price}
				</Text>

				{/* Size */}
				<View style={styles.sizeBox}>
					<Text style={styles.sizeText}>{sizeTitle}</Text>
				</View>

				{/* Out of Stock Ribbon with Animation */}
				{product.isOutOfStock && (
					<Animated.View
						style={[
							styles.outOfStockRibbonContainer,
							{ transform: [{ scale: ribbonScaleAnim }] },
						]}
					>
						<View style={styles.outOfStockRibbon}>
							<Text style={styles.outOfStockRibbonText}>
								Out of Stock
							</Text>
						</View>
					</Animated.View>
				)}
				{/* </View> */}
			</Animated.View>
		</TouchableWithoutFeedback>
	);
}

const styles = StyleSheet.create({
	card: {
		width: cardWidth,
		backgroundColor: "#fff",
		borderRadius: 10,
		padding: 10,
		marginBottom: 16,
		marginHorizontal: 8,
		elevation: 3,
		position: "relative",
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: 130,
		resizeMode: "contain",
		borderRadius: 6,
	},
	badge: {
		position: "absolute",
		top: 8,
		left: 8,
		backgroundColor: "#FFA726",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		zIndex: 2,
	},
	badgeText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "bold",
	},
	name: {
		fontSize: 14,
		fontWeight: "600",
		marginTop: 8,
	},
	vendor: {
		fontSize: 12,
		color: "#666",
	},
	priceRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 4,
	},
	price: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#000",
		marginRight: 6,
	},
	strikePrice: {
		fontSize: 12,
		color: "#999",
		textDecorationLine: "line-through",
	},
	savedPrice: {
		fontSize: 12,
		color: "green",
		marginTop: 2,
	},
	sizeBox: {
		backgroundColor: "#eee",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
		marginTop: 6,
		alignSelf: "flex-start",
	},
	sizeText: {
		fontSize: 12,
		color: "#333",
	},

	ribbonContainer: {
		position: "absolute",
		top: 0,
		left: 0,
		width: 80,
		height: 80,
		zIndex: 4,
	},

	ribbon: {
		backgroundColor: "#71BC78",
		position: "absolute",
		top: 14, // slightly above
		left: -30,
		width: 120,
		transform: [{ rotate: "-45deg" }],
		alignItems: "center",
		paddingVertical: 1,
		opacity: 0.95, // slightly transparent
	},

	ribbonText: {
		color: "#fff",
		fontSize: 9,
		fontWeight: "600",
		textTransform: "uppercase",
	},

	outOfStockRibbonContainer: {
		position: "absolute",
		top: 0,
		left: 0,
		width: 80,
		height: 70,
		zIndex: 5,
	},

	outOfStockRibbon: {
		backgroundColor: "#999",
		position: "absolute",
		top: 35, // shifted below original
		left: -30,
		width: 120,
		transform: [{ rotate: "-45deg" }], // same tilt
		alignItems: "center",
		paddingVertical: 1,
		opacity: 0.6, // more transparent
	},

	outOfStockRibbonText: {
		color: "#fff",
		fontSize: 9,
		fontWeight: "600",
		textTransform: "uppercase",
	},
	// imageWrap: {
	// 	width: "100%",
	// 	height: 100,
	// 	borderRadius: 6,
	// 	overflow: "hidden",
	// 	backgroundColor: "#FFF",
	// 	justifyContent: "center",
	// 	alignItems: "center",
	// },
	skeleton: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "#E0E0E0",
		overflow: "hidden",
	},
	// shimmer: {
	// 	width: 60,
	// 	height: "100%",
	// 	backgroundColor: "#fff",
	// 	opacity: 0.6,
	// },
	imageWrap: {
		width: "100%",
		height: 130,
		borderRadius: 10,
		overflow: "hidden",
		backgroundColor: "#ffffffff",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 8,
	},

	/* Base grey panel the shimmer sweeps across */
	skeletonBase: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "#E9ECEF",
		borderRadius: 10,
		overflow: "hidden",
	},

	/* Wider shimmer using gradient */
	shimmer: {
		position: "absolute",
		width: cardWidth * 0.8,
		height: "100%",
		opacity: 0.7,
		borderRadius: 10,
	},

	/* Optional text skeleton under the image (shown only while !imgLoaded) */
	textSkeletonArea: {
		position: "absolute",
		bottom: -48, // sits in the space where text begins
		left: 0,
		right: 0,
		paddingHorizontal: 2,
	},

	skelLine: {
		height: 12,
		backgroundColor: "#E9ECEF",
		borderRadius: 6,
	},

	skelLineSm: {
		height: 10,
		backgroundColor: "#E9ECEF",
		borderRadius: 6,
		opacity: 0.9,
	},
});
