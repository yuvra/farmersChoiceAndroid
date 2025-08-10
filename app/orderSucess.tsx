import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

export default function OrderSuccessScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/success-illustration.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>Order Placed Successfully!</Text>
      <Text style={styles.subtext}>Thank you for shopping with Farmers Choice</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.buttonText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: "90%",
    height: 300,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    fontFamily: "Poppins",
    color: "#4caf50",
    textAlign: "center",
  },
  subtext: {
    fontSize: 14,
    color: "#555",
    marginVertical: 10,
    fontFamily: "Poppins",
    textAlign: "center",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#4caf50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins",
  },
});
