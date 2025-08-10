// app/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Layout() {
    return (
        <Tabs screenOptions={{ headerShown: true }}>
            <Tabs.Screen
                name="index"
                options={{
                    headerShown: false,
                    title: "Agri Store",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="my-orders"
                options={{
                    title: "My Orders",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="leaf" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "My Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="checkoutScreen"
                options={{
                    href: null,
                    title: "checkoutScreen",
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="productDetails"
                options={{
                    href: null,
                    title: "productDetail",
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="cart"
                options={{
                    href: null,
                    title: "cart",
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="orderSucess"
                options={{
                    href: null,
                    title: "orderSucess",
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list" size={size} color={color} />
                    ),
                }}
            />
            {/* Hidden routes */}
            {[
                "payment",
                // "cart",
                "wishList",
                // "productDetails",
                "addNewAddressScreen",
                // "orderSucess",
            ].map((route) => (
                <Tabs.Screen
                    key={route}
                    name={route}
                    options={{ href: null, title: route }}
                />
            ))}
        </Tabs>
    );
}
