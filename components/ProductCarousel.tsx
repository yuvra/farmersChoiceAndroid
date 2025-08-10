import React, { useState } from "react";
import {
    View,
    Image,
    Dimensions,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import { useSharedValue } from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function ProductCarousel({ images }: { images: string[] }) {
    const progress = useSharedValue(0);
    const [imageLoadStatus, setImageLoadStatus] = useState<boolean[]>(
        Array(images.length).fill(true)
    );

    return (
        <View style={styles.carouselContainer}>
            <Carousel
                loop
                width={width}
                height={width * 0.6}
                autoPlay={true}
                data={images}
                scrollAnimationDuration={2500}
                renderItem={({ item, index }) => (
                    <View style={styles.itemContainer}>
                        {imageLoadStatus[index] && (
                            <ActivityIndicator
                                size="large"
                                color="#888"
                                style={styles.loader}
                            />
                        )}
                        <Image
                            source={{ uri: item }}
                            style={styles.image}
                            resizeMode="contain"
                            onLoadStart={() => {
                                const newStatus = [...imageLoadStatus];
                                newStatus[index] = true;
                                setImageLoadStatus(newStatus);
                            }}
                            onLoadEnd={() => {
                                const newStatus = [...imageLoadStatus];
                                newStatus[index] = false;
                                setImageLoadStatus(newStatus);
                            }}
                        />
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    carouselContainer: {
        marginBottom: 10,
    },
    itemContainer: {
        width: width,
        height: width * 0.6,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    image: {
        width: width,
        height: width * 0.6,
        borderRadius: 8,
    },
    loader: {
        position: "absolute",
        zIndex: 1,
    },
    dotsContainer: {
        marginTop: 10,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
    },
    dot: {
        width: 8,
        height: 8,
        backgroundColor: "#ccc",
        borderRadius: 4,
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: "#333",
        width: 10,
        height: 10,
    },
});
