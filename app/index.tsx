import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Image,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import AppHeader from "@/components/AppHeader";
import { Product, useAgriStore } from "@/store/useAgriStore";
import ProductCard from "@/components/ProductCard";

const categories = [
    { name: "Fungicides", icon: require("../assets/images/fungi_2.png") },
    { name: "Insecticides", icon: require("../assets/images/inst_2.png") },
    { name: "Herbicide", icon: require("../assets/images/herbis.png") },
    { name: "Nutrients", icon: require("../assets/images/nutrients.png") },
];

const categoryMap: Record<string, string> = {
    Fungicides: "Fungicide",
    Insecticides: "Insecticides",
    Herbicide: "Herbicide",
    Nutrients: "Nutrient",
};

export default function AgriStore() {
    const {
        selectedCategory,
        setSelectedCategory,
        products,
        setProducts,
        loading,
        setLoading,
        lastVisibleDoc,
        setLastVisibleDoc,
    } = useAgriStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [hasMoreProducts, setHasMoreProducts] = useState(true);

    const fetchProducts = async (isInitial = false) => {
        if (!selectedCategory || loading || (!isInitial && !hasMoreProducts))
            return;
        setLoading(true);

        try {
            const queryKey = categoryMap[selectedCategory] || selectedCategory;
            let query = firestore()
                .collection("products")
                .where("productType.en", "==", queryKey)
                .where("showProduct", "==", true)
                .orderBy("productName.en")
                .limit(10);

            if (!isInitial && lastVisibleDoc) {
                query = query.startAfter(lastVisibleDoc);
            }

            const snapshot = await query.get();
            const newProducts = snapshot.docs.map((doc) => ({
                productId: doc.id,
                ...doc.data(),
            })) as Product[];

            if (isInitial) {
                setProducts(newProducts);
            } else {
                const merged = [...products, ...newProducts];
                const unique = merged.filter(
                    (prod, index, self) =>
                        index ===
                        self.findIndex((p) => p.productId === prod.productId)
                );
                setProducts(unique);
            }

            if (snapshot.docs.length < 10) {
                setHasMoreProducts(false);
            }

            setLastVisibleDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setProducts([]);
        setLastVisibleDoc(null);
        setHasMoreProducts(true);
        fetchProducts(true);
    }, [selectedCategory]);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredProducts(products);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = products.filter((prod) =>
                prod.productName.en.toLowerCase().includes(lowerQuery)
            );
            setFilteredProducts(filtered);
        }
    }, [searchQuery, products]);

    return (
        <View style={styles.container}>
            <View style={{}}>
                <AppHeader />
            </View>

            {/* Category Row */}
            <View style={styles.categoryContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {categories.map((cat: any, idx) => (
                        <TouchableOpacity
                            key={idx}
                            onPress={() => {
                                setSearchQuery("");
                                setSelectedCategory(cat.name);
                            }}
                            style={[
                                styles.categoryItem,
                                selectedCategory === cat.name &&
                                    styles.activeCategory,
                            ]}
                        >
                            <Image
                                source={cat.icon}
                                style={styles.categoryIcon}
                            />
                            <Text style={styles.categoryText}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="gray" />
                <TextInput
                    placeholder="Search products here"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                        <Ionicons name="close-circle" size={20} color="gray" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Product Grid */}
            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.productId?.toString()}
                renderItem={({ item }) => <ProductCard product={item} />}
                numColumns={2}
                contentContainerStyle={
                    filteredProducts.length === 0
                        ? [
                              styles.flatListContent,
                              { flexGrow: 1, justifyContent: "center" },
                          ]
                        : styles.flatListContent
                }
                onEndReached={() => fetchProducts(false)}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loading ? (
                        <ActivityIndicator
                            size="small"
                            color="#f57c00"
                            style={{ marginVertical: 20 }}
                        />
                    ) : null
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>
                                    {searchQuery
                                        ? `No results for "${searchQuery}"`
                                        : "No products to display"}
                                </Text>
                            </View>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        // paddingHorizontal: "3%",
    },
    categoryContainer: {
        height: "12%",
        justifyContent: "center",
        marginVertical: "2%",
    },
    categoryItem: {
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        paddingVertical: "2%",
        paddingHorizontal: "3%",
        borderRadius: 8,
    },
    activeCategory: {
        backgroundColor: "#d7d7d7ff",
    },
    categoryIcon: {
        width: 50,
        height: 50,
        resizeMode: "contain",
        marginBottom: 4,
    },
    categoryText: {
        fontSize: 12,
        textAlign: "center",
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        height: "7%",
        backgroundColor: "#fff",
        borderRadius: 10,
        paddingHorizontal: "4%",
        marginBottom: "3%",
    },
    input: {
        flex: 1,
        fontSize: 14,
        marginHorizontal: 10,
    },
    flatListContent: {
        paddingBottom: 100,
        gap: 10,
    },
    emptyContainer: {
        flex: 1,
        // justifyContent: 'center',
        alignItems: "center",
        // padding: 20,
        paddingTop: "50%", // to avoid overlap with header
    },
    emptyCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        width: "60%",
        maxWidth: 360,
    },
    emptyText: {
        fontSize: 14,
        color: "#333",
        textAlign: "center",
    },
});
