import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ToastAndroid,
    ScrollView,
    Image,
    ActivityIndicator,
    Animated,
} from "react-native";
import { useAgriStore } from "@/store/useAgriStore";
import { db } from "@/utils/firebaseConfig";
import {
    collection,
    query,
    getDocs,
    doc,
    setDoc,
    getDoc,
} from "firebase/firestore";
import auth from "@react-native-firebase/auth";
import axios from "axios";
import * as Animatable from "react-native-animatable";

export default function MobileVerificationScreen() {
    const RESEND_COOLDOWN = 30; // seconds
    const setAddress = useAgriStore((s) => s.setAddress);
    const clearAddress = useAgriStore((s) => s.clearAddress);
    const address = useAgriStore((s) => s.address);

    const [mobile, setMobile] = useState("");
    const [sendVia, setSendVia] = useState<"firebase" | "lambda">("lambda"); // selector
    const [sentVia, setSentVia] = useState<"firebase" | "lambda" | null>(null); // actual used method
    const [resendLeft, setResendLeft] = useState(0);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", ""]);
    const otpRefs = React.useRef<Array<TextInput | null>>([]);
    const [error, setError] = useState("");
    const [infoHint, setInfoHint] = useState("");
    const [isOtpFocused, setIsOtpFocused] = useState(false);
    const [confirm, setConfirm] = useState<any>(null); // only used for Firebase path
    const [loading, setLoading] = useState(false);
    const [loadingVerify, setLoadingVerify] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [addressDetails, setAddressDetails] = useState({
        name: "",
        flat: "",
        street: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
        landmark: "",
        country: "India",
        phone: "",
    });

    // blinking caret
    const caretOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        setOtp(otpDigits.join(""));
    }, [otpDigits]);

    useEffect(() => {
        resetOtpState();
    }, []);

    useEffect(() => {
        let loop: Animated.CompositeAnimation | null = null;
        if (isOtpFocused) {
            loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(caretOpacity, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(caretOpacity, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            loop.start();
        }
        return () => loop?.stop?.();
    }, [isOtpFocused, caretOpacity]);

    const activeIndex = Math.min(otp.length, 3);

    // countdown effect
    useEffect(() => {
        if (!otpSent || resendLeft <= 0) return;
        const id = setInterval(() => {
            setResendLeft((s) => (s > 0 ? s - 1 : 0));
        }, 1000);
        return () => clearInterval(id);
    }, [otpSent, resendLeft]);

    const fmtTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
            s % 60
        ).padStart(2, "0")}`;

    const focusBox = (i: number) => {
        otpRefs.current[i]?.focus();
    };

    const handleBoxChange = (text: string, i: number) => {
        const only = text.replace(/\D/g, "");
        // Paste case (e.g., "1234" into one box)
        if (only.length > 1) {
            const next = [...otpDigits];
            for (let k = 0; k < 4; k++) {
                next[i + k] = only[k] ?? next[i + k] ?? "";
            }
            setOtpDigits(next.slice(0, 4));
            const lastIndex = Math.min(i + only.length, 4) - 1;
            if (lastIndex < 3) focusBox(lastIndex + 1);
            return;
        }

        // Normal single char
        const next = [...otpDigits];
        next[i] = only.slice(-1); // keep last typed digit
        setOtpDigits(next);

        if (only && i < 3) focusBox(i + 1); // move forward when a digit is entered
    };

    const handleBoxKeyPress = (e: any, i: number) => {
        if (e.nativeEvent.key === "Backspace") {
            if (otpDigits[i]) {
                // just clear current box
                const next = [...otpDigits];
                next[i] = "";
                setOtpDigits(next);
            } else if (i > 0) {
                // move left and clear previous
                focusBox(i - 1);
                const next = [...otpDigits];
                next[i - 1] = "";
                setOtpDigits(next);
            }
        }
    };

    // ---------- Lambda client ----------
    const LAMBDA_API_BASE =
        "https://l2rosu7sbeafj6rmenz4p2qd4i0owegl.lambda-url.ap-south-1.on.aws";

    const infoMessage = "OTP sent! If SMS delays, you might get a quick call.";

    const client = axios.create({
        baseURL: LAMBDA_API_BASE,
        timeout: 15000,
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true, // let us handle non-200
    });

    // ---------- Send OTP (Firebase) ----------
    const sendOtpWithFirebase = async () => {
        setOtp("");
        const fullPhone = `+91${mobile}`;
        const confirmation = await auth().signInWithPhoneNumber(fullPhone);
        setConfirm(confirmation);
        setOtpSent(true);
        setSentVia("firebase");
        setResendLeft(RESEND_COOLDOWN); // << start timer
        ToastAndroid.show("OTP sent via Firebase", ToastAndroid.SHORT);

        setInfoHint(infoMessage);
    };

    // ---------- Send OTP (Lambda) ----------
    const sendOtpWithLambda = async () => {
        setOtp("");
        const phone = `+91${mobile}`.trim();
        const res = await client.post("/otp/send", { phone });

        if (res.status === 200 && res.data?.ok) {
            setConfirm(null); // not used for Lambda path
            setOtpSent(true);
            setSentVia("lambda");
            setResendLeft(RESEND_COOLDOWN); // << start timer
            setInfoHint(infoMessage);
            ToastAndroid.show("OTP sent via SMS (Lambda)", ToastAndroid.SHORT);
            return;
        }
        throw new Error(
            res.data?.provider?.Details ||
                res.data?.error ||
                "Failed to send OTP"
        );
    };

    // ---------- Send dispatcher ----------
    const handleSendOtp = async () => {
        if (mobile.length !== 10) {
            setError("Enter valid 10-digit mobile number");
            return;
        }
        setError("");
        setLoading(true);

        try {
            if (sendVia === "firebase") {
                await sendOtpWithFirebase();
            } else {
                await sendOtpWithLambda();
            }
        } catch (err: any) {
            console.error("OTP send error:", err);
            const msg =
                err?.code === "auth/too-many-requests"
                    ? "Too many requests. Please try again later."
                    : err?.code === "auth/invalid-phone-number"
                    ? "Invalid phone number. Try again."
                    : err?.message || "Failed to send OTP. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ---------- Post-verify: load or prompt address ----------
    const loadOrPromptAddress = async () => {
        // try direct doc by phone first
        const directRef = doc(db, "userProfilesAndOrderStatus", mobile);
        const directSnap = await getDoc(directRef);
        if (directSnap.exists()) {
            const data = directSnap.data();
            const first = (data.profile || [])[0] || null;
            if (first) {
                setAddress(first);
                ToastAndroid.show(
                    "Verified & address loaded",
                    ToastAndroid.SHORT
                );
                return;
            }
        }

        // fallback to scan (in case data structure differs)
        const qRef = query(collection(db, "userProfilesAndOrderStatus"));
        const querySnapshot = await getDocs(qRef);
        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            const match = (data.profile || []).find(
                (p: any) => p.phone === mobile
            );
            if (match) {
                setAddress(match);
                ToastAndroid.show(
                    "Verified & address loaded",
                    ToastAndroid.SHORT
                );
                return;
            }
        }

        // not found → show form prefilled with phone
        setAddressDetails((prev) => ({ ...prev, phone: mobile }));
        setShowAddressForm(true);
    };

    // ---------- Verify (Lambda) ----------
    const verifyOtpWithLambda = async () => {
        const phone = `+91${mobile}`.trim();
        const res = await client.post("/otp/verify", {
            phone,
            otp: otp.trim(),
        });

        // Lambda returns 2Factor JSON as-is
        if (
            res.status === 200 &&
            res.data?.Status === "Success" &&
            res.data?.Details === "OTP Matched"
        ) {
            return true;
        }
        throw new Error(res.data?.Details || "OTP verification failed");
    };

    // ---------- Verify dispatcher ----------
    const handleVerifyOtp = async () => {
        if (otp.trim().length < 4) {
            setError("Enter a valid OTP");
            return;
        }

        setLoadingVerify(true);
        setError("");

        // use the method that actually sent the OTP (prevents mid-flow toggle issues)
        const method = sentVia ?? sendVia;

        try {
            if (method === "firebase") {
                if (!confirm) {
                    setError(
                        "Confirmation not found. Please resend OTP via Firebase."
                    );
                    return;
                }
                await confirm.confirm(otp.trim());
            } else {
                await verifyOtpWithLambda();
            }

            await loadOrPromptAddress();
        } catch (err: any) {
            console.error("OTP verification error:", err);
            setError("Incorrect OTP. Please try again.");
        } finally {
            setLoadingVerify(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendLeft > 0) return; // guard (button will also be disabled)
        setError("");
        setLoading(true);
        try {
            const method = sentVia ?? sendVia; // prefer what actually sent
            if (method === "firebase") {
                await sendOtpWithFirebase();
            } else {
                await sendOtpWithLambda();
            }
            setResendLeft(RESEND_COOLDOWN); // restart timer on successful resend
            ToastAndroid.show("OTP resent", ToastAndroid.SHORT);
        } catch (err: any) {
            console.error("Resend error:", err);
            setError(err?.message || "Failed to resend OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetOtpState = () => {
        setOtp("");
        setOtpDigits(["", "", "", ""]);
        setOtpSent(false);
        setConfirm(null);
        setSentVia(null);
        setResendLeft(0);
        setInfoHint("");
        setError("");
        setLoading(false);
        setLoadingVerify(false);
    };

    // ---------- Save address ----------
    const handleSaveAddress = async () => {
        const phone = addressDetails.phone;
        if (!phone) {
            ToastAndroid.show("Phone number missing", ToastAndroid.SHORT);
            return;
        }

        const newDocRef = doc(db, "userProfilesAndOrderStatus", phone);
        const fullAddress = { ...addressDetails };

        await setDoc(newDocRef, {
            profile: [fullAddress],
            orders: [],
        });

        setAddress(fullAddress);
        ToastAndroid.show("Address saved", ToastAndroid.SHORT);
        setShowAddressForm(false);
    };

    const isFormValid = () => {
        return Object.entries(addressDetails).every(([key, value]) =>
            key === "phone" ? true : (value as string).trim() !== ""
        );
    };

    // ---------- UI ----------
    return (
        <ScrollView contentContainerStyle={styles.container}>
            {!showAddressForm && !address && (
                <>
                    <View
                        style={styles.inputGroup}
                        pointerEvents={otpSent || loading ? "none" : "auto"}
                    >
                        <Text style={styles.label}>Enter Mobile Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="10-digit mobile number"
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={mobile}
                            onChangeText={(v) =>
                                setMobile(v.replace(/\D/g, ""))
                            }
                        />
                    </View>

                    {otpSent && (
                        <View
                            style={styles.inputGroup}
                            pointerEvents={loadingVerify ? "none" : "auto"}
                        >
                            <Text style={styles.label}>Enter OTP</Text>

                            <View style={styles.otpRow}>
                                {[0, 1, 2, 3].map((i) => (
                                    <TextInput
                                        key={i}
                                        ref={(el: any) =>
                                            (otpRefs.current[i] = el)
                                        }
                                        value={otpDigits[i]}
                                        onChangeText={(t) =>
                                            handleBoxChange(t, i)
                                        }
                                        onKeyPress={(e) =>
                                            handleBoxKeyPress(e, i)
                                        }
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        style={[
                                            styles.otpBoxInput,
                                            otpDigits[i]
                                                ? styles.otpBoxFilled
                                                : null,
                                        ]}
                                        returnKeyType={
                                            i === 3 ? "done" : "next"
                                        }
                                        onFocus={() => setError("")}
                                    />
                                ))}
                            </View>

                            {infoHint ? (
                                <Animatable.View
                                    animation="fadeInDown"
                                    duration={800}
                                    easing="ease-out"
                                    style={styles.infoHintCard}
                                >
                                    <Text style={styles.infoHintText}>
                                        {infoHint}
                                    </Text>
                                </Animatable.View>
                            ) : null}
                            {/* Resend row */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                {resendLeft > 0 ? (
                                    <Text style={{ color: "#777" }}>
                                        Resend in {fmtTime(resendLeft)}
                                    </Text>
                                ) : (
                                    <Text style={{ color: "#4caf50" }}>
                                        You can resend now
                                    </Text>
                                )}

                                <TouchableOpacity
                                    onPress={handleResendOtp}
                                    disabled={
                                        resendLeft > 0 ||
                                        loading ||
                                        loadingVerify
                                    }
                                    style={[
                                        styles.resendButton,
                                        (resendLeft > 0 ||
                                            loading ||
                                            loadingVerify) &&
                                            styles.resendButtonDisabled,
                                    ]}
                                >
                                    <Text style={styles.resendText}>
                                        Resend OTP
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {error !== "" && <Text style={styles.error}>{error}</Text>}

                    {!otpSent ? (
                        loading ? (
                            <View style={styles.loaderButton}>
                                <ActivityIndicator size="small" color="#333" />
                                <Text style={styles.loaderText}>
                                    {" "}
                                    Sending OTP...
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleSendOtp}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>Send OTP</Text>
                            </TouchableOpacity>
                        )
                    ) : loadingVerify ? (
                        <View style={styles.loaderButton}>
                            <ActivityIndicator size="small" color="#333" />
                            <Text style={styles.loaderText}> Verifying...</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleVerifyOtp}
                            disabled={loadingVerify}
                        >
                            <Text style={styles.buttonText}>Verify OTP</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}

            {showAddressForm && (
                <>
                    <Text style={styles.title}>Complete Your Address</Text>
                    {Object.keys(addressDetails).map((key) =>
                        key === "phone" ? null : (
                            <View key={key} style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}{" "}
                                    <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    placeholder={`Enter ${key}`}
                                    style={styles.input}
                                    value={(addressDetails as any)[key]}
                                    onChangeText={(val) =>
                                        setAddressDetails((prev) => ({
                                            ...prev,
                                            [key]: val,
                                        }))
                                    }
                                />
                            </View>
                        )
                    )}
                    <TouchableOpacity
                        style={[
                            styles.button,
                            !isFormValid() && styles.disabledButton,
                        ]}
                        onPress={handleSaveAddress}
                        disabled={!isFormValid()}
                    >
                        <Text style={styles.buttonText}>Save Address</Text>
                    </TouchableOpacity>
                </>
            )}

            {address && !showAddressForm && (
                <View style={styles.cardWrapper}>
                    <View
                        className="profileHeader"
                        style={styles.profileHeader}
                    >
                        <Image
                            source={require("@/assets/images/inst.png")}
                            style={styles.avatar}
                        />
                        <Text style={styles.profileName}>{address.name}</Text>
                        <Text style={styles.profilePhone}>
                            +91 {address.phone}
                        </Text>
                    </View>

                    <View style={styles.addressBlock}>
                        <Text style={styles.blockTitle}>Address</Text>
                        <Text style={styles.blockText}>
                            Flat: {address.flat}
                        </Text>
                        <Text style={styles.blockText}>
                            Street: {address.street}
                        </Text>
                        <Text style={styles.blockText}>
                            Landmark: {address.landmark}
                        </Text>
                        <Text style={styles.blockText}>
                            City: {address.city}
                        </Text>
                        <Text style={styles.blockText}>
                            District: {address.district}
                        </Text>
                        <Text style={styles.blockText}>
                            State: {address.state}
                        </Text>
                        <Text style={styles.blockText}>
                            Pincode: {address.pincode}
                        </Text>
                        <Text style={styles.blockText}>
                            Country: {address.country}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={() => {
                            clearAddress();
                            setMobile("");
                            setOtp("");
                            setOtpSent(false);
                            setConfirm(null);
                            setShowAddressForm(false);
                            setError("");
                            setResendLeft(0);
                            setSentVia(null);
                            setInfoHint("");
                            resetOtpState();
                        }}
                    >
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
        marginBottom: 4,
        fontFamily: "Poppins",
    },
    required: {
        color: "red",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        fontFamily: "Poppins",
    },
    error: {
        color: "red",
        textAlign: "center",
        marginBottom: 12,
    },
    button: {
        backgroundColor: "#4caf50",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 12,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
        fontFamily: "Poppins",
    },
    loaderButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#e0e0e0",
        padding: 14,
        borderRadius: 8,
        marginBottom: 12,
    },
    loaderText: {
        fontSize: 16,
        fontFamily: "Poppins",
        marginLeft: 8,
        color: "#333",
    },
    cardWrapper: {
        backgroundColor: "#e8f5e9",
        padding: 20,
        borderRadius: 10,
        elevation: 2,
        marginTop: 20,
        alignItems: "center",
    },
    profileHeader: {
        alignItems: "center",
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10,
    },
    profileName: {
        fontSize: 18,
        fontWeight: "bold",
        fontFamily: "Poppins",
    },
    profilePhone: {
        fontSize: 16,
        fontFamily: "Poppins",
    },
    addressBlock: {
        alignSelf: "stretch",
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        marginVertical: 10,
        elevation: 1,
    },
    blockTitle: {
        fontSize: 17,
        fontWeight: "bold",
        marginBottom: 8,
        fontFamily: "Poppins",
    },
    blockText: {
        fontSize: 15,
        fontFamily: "Poppins",
        marginBottom: 4,
    },
    logoutButton: {
        backgroundColor: "#fff",
        padding: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#f44336",
    },
    logoutText: {
        color: "#f44336",
        fontSize: 16,
        fontWeight: "bold",
        fontFamily: "Poppins",
    },
    disabledButton: {
        backgroundColor: "#ccc",
    },
    resendButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#4caf50",
    },
    resendButtonDisabled: {
        opacity: 0.5,
        borderColor: "#ccc",
    },
    resendText: {
        color: "#4caf50",
        fontWeight: "600",
    },
    infoHint: {
        color: "#616161",
        fontSize: 13,
        marginTop: -6,
        marginBottom: 8,
        fontFamily: "Poppins",
    },
    infoHintCard: {
        backgroundColor: "#E8F5E9", // light green
        borderRadius: 8,
        padding: 10,
        marginTop: -4,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#C8E6C9",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    infoHintText: {
        color: "#2E7D32", // dark green
        fontSize: 13,
        fontFamily: "Poppins",
        textAlign: "center",
    },
    otpContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10, // if older RN, replace with marginRight on boxes
        marginVertical: 12,
        position: "relative",
    },
    otpBox: {
        width: 52,
        height: 52,
        borderWidth: 1,
        borderColor: "#CFCFCF",
        borderRadius: 10,
        backgroundColor: "#FFF",
        justifyContent: "center",
        alignItems: "center",
    },
    otpBoxActive: {
        borderColor: "#4caf50",
        shadowColor: "#4caf50",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    otpDigit: {
        fontSize: 20,
        fontWeight: "700",
        color: "#333",
    },
    caret: {
        width: 2,
        height: 24,
        backgroundColor: "#4caf50",
        borderRadius: 1,
    },
    hiddenOtpInput: {
        position: "absolute",
        // stretch across the row so any tap focuses it
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: 0,
    },
    hiddenInput: {
        position: "absolute",
        width: "100%",
        height: "100%",
        opacity: 0, // Invisible
    },
    otpRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: 12,
    },
    otpBoxInput: {
        width: 52,
        height: 52,
        borderWidth: 1,
        borderColor: "#CFCFCF",
        borderRadius: 10,
        backgroundColor: "#FFF",
        textAlign: "center",
        fontSize: 20,
        fontWeight: "700",
        color: "#333",
    },
    otpBoxFilled: {
        borderColor: "#4caf50",
        shadowColor: "#4caf50",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
});
