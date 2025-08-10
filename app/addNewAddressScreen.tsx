import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAgriStore } from "@/store/useAgriStore";
import { Ionicons } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

export default function DeliveryAddressScreen() {
  const router = useRouter();
  const address: any = useAgriStore((s) => s.address);
  const setAddress = useAgriStore((s) => s.setAddress);
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificationId, setVerificationId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    flat: "",
    street: "",
    pincode: "",
    city: "",
    district: "",
    state: "",
    landmark: "",
    country: "India",
  });

  useEffect(() => {
    if (!address) setLoading(false);
  }, []);

  const sendOTP = async () => {
    if (!form.phone) return Alert.alert("Enter phone number");
    setApiLoading(true);
    try {
      const confirmation: any = await auth().signInWithPhoneNumber("+91" + form.phone);
      setVerificationId(confirmation.verificationId);
      setOtpSent(true);
      Alert.alert("OTP Sent");
    } catch (error: any) {
      Alert.alert("OTP Error", error.message);
    } finally {
      setApiLoading(false);
    }
  };

  const confirmCode = async () => {
    setApiLoading(true);
    try {
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
      await auth().signInWithCredential(credential);
      Alert.alert("Phone Verified");
      setPhoneVerified(true);

      // Fetch address from Firestore
      const snapshot = await firestore().collection("userProfilesAndOrderStatus").get();
      let matchedAddress: any = null;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (Array.isArray(data.profile)) {
          const found = data.profile.find((addr: any) => addr.phone === form.phone);
          if (found) {
            matchedAddress = found;
          }
        }
      });

      if (matchedAddress) {
        setAddress(matchedAddress);
        setForm({
          name: matchedAddress.name || "",
          phone: matchedAddress.phone || "",
          flat: matchedAddress.flat || "",
          street: matchedAddress.street || "",
          pincode: matchedAddress.pincode || "",
          city: matchedAddress.city || "",
          district: matchedAddress.district || "",
          state: matchedAddress.state || "",
          landmark: matchedAddress.landmark || "",
          country: matchedAddress.country || "India",
        });
        setFormVisible(false);
        router.push("/checkoutScreen");
      }
    } catch (err: any) {
      Alert.alert("Invalid OTP", err.message);
    } finally {
      setApiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!phoneVerified) return Alert.alert("Please verify phone number");
    if (!form.name || !form.phone || !form.street || !form.pincode || !form.city || !form.district || !form.state) {
      Alert.alert("Please fill all required fields");
      return;
    }

    const addressData: any = { ...form };
    setApiLoading(true);
    try {
      const uid = auth().currentUser?.uid;
      if (!uid) throw new Error("User not authenticated");
      const profileRef = firestore().collection("userProfilesAndOrderStatus").doc(uid);
      await profileRef.set({
        profile: firestore.FieldValue.arrayUnion(addressData),
      }, { merge: true });
      setAddress(addressData);
      setFormVisible(false);
      router.push("/checkoutScreen");
    } catch (error: any) {
      Alert.alert("Error saving address", error.message);
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Address</Text>
      </View>

      {apiLoading && <ActivityIndicator size="large" color="#4caf50" style={{ marginVertical: 20 }} />}

      <ScrollView style={{ padding: 16 }}>
        {!loading && address && (
          <View style={styles.card}>
            <Text style={styles.name}>{address.name}</Text>
            <Text style={styles.detail}>{address.street}, {address.city}, {address.state}</Text>
            <Text style={styles.detail}>Phone: {address.phone}</Text>
            <TouchableOpacity onPress={() => setFormVisible(true)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !address && (
          <TouchableOpacity onPress={() => setFormVisible(true)} style={styles.addBtn}>
            <Ionicons name="add" size={20} color="#4caf50" />
            <Text style={styles.addText}>Add New Address</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={formVisible} animationType="slide">
        <View style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
          <ScrollView>
            <TextInput placeholder="Mobile Number *" style={styles.input} keyboardType="phone-pad" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} />
            {!otpSent && <TouchableOpacity style={[styles.saveBtn, { marginTop: 0 }]} onPress={sendOTP}><Text style={styles.saveText}>Send OTP</Text></TouchableOpacity>}

            {otpSent && !phoneVerified && (
              <View style={styles.row}>
                <TextInput placeholder="Enter OTP" style={[styles.input, { flex: 1, marginRight: 8 }]} keyboardType="number-pad" value={otp} onChangeText={setOtp} />
                <TouchableOpacity style={[styles.saveBtn, { flex: 1, marginTop: 0 }]} onPress={confirmCode}>
                  <Text style={styles.saveText}>Verify OTP</Text>
                </TouchableOpacity>
              </View>
            )}

            {phoneVerified && (
              <>
                <TextInput placeholder="Full Name *" style={styles.input} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
                <TextInput placeholder="Flat / House No (If Any)" style={styles.input} value={form.flat} onChangeText={(t) => setForm({ ...form, flat: t })} />
                <TextInput placeholder="Street / Area / Colony / Village *" style={styles.input} value={form.street} onChangeText={(t) => setForm({ ...form, street: t })} />
                <View style={styles.row}>
                  <TextInput placeholder="Pincode *" style={[styles.input, { flex: 1, marginRight: 8 }]} keyboardType="numeric" value={form.pincode} onChangeText={(t) => setForm({ ...form, pincode: t })} />
                  <TextInput placeholder="City *" style={[styles.input, { flex: 1 }]} value={form.city} onChangeText={(t) => setForm({ ...form, city: t })} />
                </View>
                <View style={styles.row}>
                  <TextInput placeholder="District *" style={[styles.input, { flex: 1, marginRight: 8 }]} value={form.district} onChangeText={(t) => setForm({ ...form, district: t })} />
                  <TextInput placeholder="State *" style={[styles.input, { flex: 1 }]} value={form.state} onChangeText={(t) => setForm({ ...form, state: t })} />
                </View>
                <TextInput placeholder="Landmark (Optional)" style={styles.input} value={form.landmark} onChangeText={(t) => setForm({ ...form, landmark: t })} />
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: "#2196F3" }]} onPress={handleSave}>
                  <Text style={styles.saveText}>Save Address</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={() => setFormVisible(false)} style={[styles.saveBtn, { backgroundColor: "#aaa", marginTop: 10 }]}>
              <Text style={styles.saveText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#4caf50",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    color: "#fff",
    marginLeft: 16,
    fontWeight: "bold",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  addText: {
    color: "#4caf50",
    fontSize: 16,
    marginLeft: 8,
  },
  card: {
    padding: 16,
    backgroundColor: "#f3f3f3",
    borderRadius: 8,
    marginBottom: 16,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  detail: {
    fontSize: 14,
    color: "#444",
    marginTop: 4,
  },
  editBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#ffa726",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saveBtn: {
    backgroundColor: "#4caf50",
    padding: 16,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 12,
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
