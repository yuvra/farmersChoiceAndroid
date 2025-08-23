// components/AppHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useAgriStore } from "../store/useAgriStore";

export default function AppHeader({
    headerName = "Farmer's Choice",
    focusWhishList = true,
    focusCart = true,
}) {
    const cartItemsItems = useAgriStore((state) => state.cartItems);

    console.log("Items in cart:", cartItemsItems);

    const handleCartPress = () => {
        router.push("/cart");
    };

    const handlewishlistPress = () => {
        router.push("/wishList");
    };

    return (
        <View style={styles.header}>
            <View style={styles.brandContainer}>
                <Image
                    source={require("../assets/images/logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.brandName}>{headerName}</Text>
            </View>

            <View style={styles.actionIcons}>
                {/* {(
          <Ionicons
            name="heart-outline"
            size={24}
            color="#fff"
            style={styles.icon}
            onPress={() => handlewishlistPress()}
          />
        )} */}

                <View
                    style={
                        !focusCart
                            ? styles.cartIconWrapper
                            : styles.cartIconWrapperFocus
                    }
                >
                    {
                        <>
                            <Ionicons
                                name="cart-outline"
                                size={30}
                                color={"#FFF"}
                                onPress={() => handleCartPress()}
                            />
                            {cartItemsItems.length > 0 && (
                                <View style={styles.cartBadge}>
                                    <Text style={styles.cartBadgeText}>
                                        {cartItemsItems.length}
                                    </Text>
                                </View>
                            )}
                        </>
                    }
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: "#4A90E2",
        padding: 16,
        paddingTop: 37,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    brandContainer: {
        flexDirection: "row",
        alignItems: "center",
        // backgroundColor: "red",
        width: "50%",
    },
    logo: {
        width: 60,
        height: 60,
        marginRight: 8,
    },
    brandName: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
        fontFamily: "Poppins",
    },
    actionIcons: {
        flexDirection: "row",
        alignItems: "center",
    },
    icon: {
        marginRight: 16,
    },
    cartIconWrapper: {
        position: "relative",
        paddingRight: 4,
    },
    cartIconWrapperFocus: {
        position: "relative",
        paddingRight: 4,
        backgroundColor: "gray",
        borderRadius: 50,
    },
    cartBadge: {
        position: "absolute",
        top: -6,
        right: -6,
        backgroundColor: "red",
        borderRadius: 10,
        paddingHorizontal: 5,
        height: 18,
        justifyContent: "center",
        alignItems: "center",
        minWidth: 18,
    },

    cartBadgeFocus: {
        position: "absolute",
        top: -6,
        right: -6,
        backgroundColor: "red",
        borderRadius: 10,
        paddingHorizontal: 5,
        height: 18,
        justifyContent: "center",
        alignItems: "center",
        minWidth: 18,
    },
    cartBadgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
});
