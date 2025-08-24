import { Feather } from "@expo/vector-icons";
import React, { memo, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Animated,
	Image,
	Linking,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	ToastAndroid,
	TouchableOpacity,
	View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

/* 🔽 Firestore */
import { db } from "@/utils/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

type Address = {
  name: string;
  flat: string;
  street: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  landmark: string;
  country: string;
  phone: string;
};

type Props = {
  address: Address;
  onSignOut: () => void;
  setAddress: any
};

const FieldRow = ({ label, value }: { label: string; value?: string }) => {
  const v = (value ?? "").trim() || "—";
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowSep}>:</Text>
      <Text style={s.rowValue}>{v}</Text>
    </View>
  );
};

function ProfileDetails({ address, onSignOut, setAddress }: Props) {
  // pulse for call button
  const callScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(callScale, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(callScale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [callScale]);

  const clean: Address = {
    ...address,
    name: (address.name || "").trim(),
    phone: (address.phone || "").trim(),
    flat: (address.flat || "").trim(),
    street: (address.street || "").trim(),
    landmark: (address.landmark || "").trim(),
    city: (address.city || "").trim(),
    district: (address.district || "").trim(),
    state: (address.state || "").trim(),
    pincode: (address.pincode || "").trim(),
    country: (address.country || "India").trim(),
  };

  const onCall = () => Linking.openURL("tel:+919011262635").catch(() => {});

  // edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Address>(clean);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(clean);
    setIsEditing(false);
  }, [address.phone]);

  const set = (k: keyof Address, v: string) =>
    setForm((p) => ({ ...p, [k]: k === "country" ? "India" : v }));

  const isValid = () => {
    const required: (keyof Address)[] = [
      "flat",
      "street",
      "city",
      "district",
      "state",
      "pincode",
    ];
    const okReq = required.every((k) => (form[k] || "").trim() !== "");
    const okPin = (form.pincode || "").trim().length === 6;
    return okReq && okPin;
  };

  /* 🔥 Save to Firestore */
  const saveToFirestore = async () => {
    if (!form.phone) {
      ToastAndroid.show("Phone number missing", ToastAndroid.SHORT);
      return;
    }
    if (!isValid()) {
      ToastAndroid.show("Please complete all fields and a valid pincode", ToastAndroid.SHORT);
      return;
    }

    try {
      setSaving(true);

      const docRef = doc(db, "userProfilesAndOrderStatus", form.phone);
      const snap = await getDoc(docRef);

      // keep existing orders; replace profile[0]
      const existingOrders = snap.exists() ? snap.data()?.orders || [] : [];

	  const updatedProfile = {
			...form,
			country: "India", // force India
			name: (form.name || clean.name).trim(), // keep original name if not editing name here
		};

      const payload = {
        profile: [
          updatedProfile
        ],
        orders: existingOrders,
      };

      await setDoc(docRef, payload, { merge: true });

	  setAddress(updatedProfile)

      ToastAndroid.show("Address updated", ToastAndroid.SHORT);
      setIsEditing(false);
    } catch (e: any) {
      console.error("save address error:", e);
      ToastAndroid.show("Failed to update address", ToastAndroid.SHORT);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={s.scrollContent}
      enableOnAndroid
      enableAutomaticScroll
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={Platform.OS === "ios" ? 24 : 90}
      extraHeight={Platform.OS === "ios" ? 0 : 140}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.card}>
        {/* Header */}
        <View style={s.header}>
          <Image source={require("@/assets/images/inst.png")} style={s.avatar} />
          <Text style={s.name}>{clean.name}</Text>

          <View style={s.phonePill}>
            <Text style={s.phonePillTxt}>+91 {clean.phone}</Text>
          </View>
        </View>

        {/* Address Block */}
        <View style={s.block}>
          <View style={s.blockTitleRow}>
            <Text style={s.blockTitle}>Address Details</Text>

            <TouchableOpacity
              onPress={() => {
                if (!isEditing) setForm(clean);
                setIsEditing((v) => !v);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={isEditing ? "Close edit" : "Edit address"}
            >
              <Feather name={isEditing ? "x" : "edit-2"} size={16} color="#1B5E20" />
            </TouchableOpacity>
          </View>

          {!isEditing ? (
            <>
              <FieldRow label="Flat / House" value={clean.flat} />
              <View style={s.divider} />
              <FieldRow label="Street" value={clean.street} />
              <View style={s.divider} />
              <FieldRow label="Landmark" value={clean.landmark} />
              <View style={s.divider} />
              <FieldRow label="City" value={clean.city} />
              <View style={s.divider} />
              <FieldRow label="District" value={clean.district} />
              <View style={s.divider} />
              <FieldRow label="State" value={clean.state} />
              <View style={s.divider} />
              <FieldRow label="Pincode" value={clean.pincode} />
              <View style={s.divider} />
              <FieldRow label="Country" value={clean.country} />
            </>
          ) : (
            <>
              {/* inputs in same rows */}
              <EditRow label="Flat / House" value={form.flat} onChangeText={(v) => set("flat", v)} />
              <View style={s.divider} />

              <EditRow label="Street" value={form.street} onChangeText={(v) => set("street", v)} />
              <View style={s.divider} />

              <EditRow
                label="Landmark"
                value={form.landmark}
                onChangeText={(v) => set("landmark", v)}
              />
              <View style={s.divider} />

              <EditRow label="City" value={form.city} onChangeText={(v) => set("city", v)} />
              <View style={s.divider} />

              <EditRow
                label="District"
                value={form.district}
                onChangeText={(v) => set("district", v)}
              />
              <View style={s.divider} />

              <EditRow label="State" value={form.state} onChangeText={(v) => set("state", v)} />
              <View style={s.divider} />

              <EditRow
                label="Pincode"
                value={form.pincode}
                keyboardType="number-pad"
                maxLength={6}
                onChangeText={(v) => set("pincode", v.replace(/\D/g, "").slice(0, 6))}
              />
              <View style={s.divider} />

              {/* Country readonly */}
              <View style={s.row}>
                <Text style={s.rowLabel}>Country</Text>
                <Text style={s.rowSep}>:</Text>
                <Text style={[s.rowValue, { color: "#666" }]}>India</Text>
              </View>

              {/* Save/Cancel */}
              <View style={{ flexDirection: "row", marginTop: 12 }}>
                <TouchableOpacity
                  style={[
                    s.callBtn,
                    { flex: 1, opacity: saving || !isValid() ? 0.6 : 1 },
                  ]}
                  onPress={saveToFirestore}
                  disabled={saving || !isValid()}
                  activeOpacity={0.9}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.callText}>Save</Text>
                  )}
                </TouchableOpacity>
                <View style={{ width: 12 }} />
                <TouchableOpacity
                  style={[s.logoutBtn, { flex: 1, backgroundColor: "#fff" }]}
                  onPress={() => {
                    setForm(clean);
                    setIsEditing(false);
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={s.logoutText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Actions row: Call Us | Sign Out (hidden while editing) */}
        {!isEditing && (
          <View style={s.actionsRow}>
            <Animated.View style={{ transform: [{ scale: callScale }], flex: 1 }}>
              <TouchableOpacity
                style={s.callBtn}
                onPress={onCall}
                activeOpacity={0.9}
                accessibilityLabel="Call customer care"
              >
                <Text style={s.callText}>📞  Call Us</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={{ width: 12 }} />

            <TouchableOpacity
              style={[s.logoutBtn, { flex: 1 }]}
              onPress={onSignOut}
              activeOpacity={0.9}
              accessibilityLabel="Sign out"
            >
              <Text style={s.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}

function EditRow({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "number-pad" | "email-address" | "phone-pad";
  maxLength?: number;
}) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowSep}>:</Text>
      <TextInput
        style={s.rowInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        returnKeyType="done"
      />
    </View>
  );
}

export default memo(ProfileDetails);

/* styles unchanged except a couple container paddings for scroll */
const s = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingBottom: 18,
  },
  card: {
    backgroundColor: "#EAF7ED",
    borderRadius: 16,
    alignItems: "center",
    marginTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },

  header: { alignItems: "center", gap: 2, marginBottom: 0, paddingTop: 5 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginTop: 5 },
  name: { fontSize: 20, fontWeight: "700", color: "#111" },

  phonePill: {
    marginTop: 2,
    backgroundColor: "#FFFFFF",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  phonePillTxt: { fontSize: 14, color: "#222", fontWeight: "600" },

  block: {
    alignSelf: "stretch",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: "#EDF0ED",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  blockTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  blockTitle: { fontSize: 16, fontWeight: "800", color: "#1B5E20" },

  row: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  rowLabel: { width: 110, fontSize: 14, color: "#555", fontWeight: "700" },
  rowSep: { width: 10, textAlign: "center", color: "#777", fontWeight: "600" },
  rowValue: { flex: 1, fontSize: 15, color: "#111", fontWeight: "500" },
  rowInput: {
    flex: 1,
    fontSize: 15,
    color: "#111",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
  },
  divider: { height: 1, backgroundColor: "#F2F2F2", marginVertical: 2 },

  actionsRow: {
    flexDirection: "row",
    alignSelf: "stretch",
    marginTop: 14,
    marginBottom: 14,
    paddingHorizontal: 15,
  },

  callBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  callText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  logoutBtn: {
    borderWidth: 1.5,
    borderColor: "#EF5350",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF5F5",
  },
  logoutText: { color: "#D32F2F", fontWeight: "800", fontSize: 15 },
});
