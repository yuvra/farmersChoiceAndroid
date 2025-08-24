import React from "react";
import {
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

type Props = {
  mobile: string;
  onChangeMobile: (v: string) => void;
  otpDigits: string[];
  otpRefs: React.MutableRefObject<(TextInput | null)[]>;
  onChangeOtpBox: (t: string, i: number) => void;
  onKeyPressOtpBox: (e: any, i: number) => void;
  otpSent: boolean;
  error: string;
  infoHint: string;
  resendLeft: number;
  fmtTime: (s: number) => string;
  loading: boolean;
  loadingVerify: boolean;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
  onResendOtp: () => void;
};

export default function VerifyMobile({
  mobile,
  onChangeMobile,
  otpDigits,
  otpRefs,
  onChangeOtpBox,
  onKeyPressOtpBox,
  otpSent,
  error,
  infoHint,
  resendLeft,
  fmtTime,
  loading,
  loadingVerify,
  onSendOtp,
  onVerifyOtp,
  onResendOtp,
}: Props) {
  const disabledResend = resendLeft > 0 || loading || loadingVerify;

  return (
    <View style={s.screen}>
      <View style={s.card}>
        {/* Header */}
        <Text style={s.title}>Verify your mobile</Text>
        <Text style={s.caption}>
          We’ll send a 4-digit OTP to your number for quick sign-in.
        </Text>

        {/* Phone */}
        <Text style={s.label}>Mobile Number</Text>
        <View style={s.phoneWrap}>
          <View style={s.ccBadge}>
            <Text style={s.ccText}>+91</Text>
          </View>
          <TextInput
            style={s.phoneInput}
            placeholder="10-digit mobile number"
            placeholderTextColor="#9E9E9E"
            keyboardType="phone-pad"
            maxLength={10}
            value={mobile}
            onChangeText={(v) => onChangeMobile(v.replace(/\D/g, ""))}
            editable={!otpSent && !loading}
            returnKeyType="done"
          />
        </View>

        {/* OTP */}
        {otpSent && (
          <>
            <Text style={[s.label, { marginTop: 14 }]}>Enter OTP</Text>
            <View style={s.otpRow}>
              {[0, 1, 2, 3].map((i) => (
                <TextInput
                  key={i}
                  ref={(el: any) => (otpRefs.current[i] = el)}
                  value={otpDigits[i]}
                  onChangeText={(t) => onChangeOtpBox(t, i)}
                  onKeyPress={(e) => onKeyPressOtpBox(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={[
                    s.otpBox,
                    otpDigits[i] ? s.otpFilled : undefined,
                  ]}
                  returnKeyType={i === 3 ? "done" : "next"}
                />
              ))}
            </View>

            {!!infoHint && <Text style={s.hint}>{infoHint}</Text>}

            <View style={s.rowBetween}>
              {resendLeft > 0 ? (
                <Text style={s.timerText}>
                  Resend in {fmtTime(resendLeft)}
                </Text>
              ) : (
                <Text style={s.readyText}>You can resend now</Text>
              )}

              <TouchableOpacity
                onPress={onResendOtp}
                disabled={disabledResend}
                style={[
                  s.resendBtn,
                  disabledResend && s.resendBtnDisabled,
                ]}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    s.resendText,
                    disabledResend && s.resendTextDisabled,
                  ]}
                >
                  Resend OTP
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {!!error && <Text style={s.error}>{error}</Text>}

        {/* Action */}
        {!otpSent ? (
          <TouchableOpacity
            style={[s.cta, loading && s.ctaDisabled]}
            onPress={onSendOtp}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={s.ctaText}>{loading ? "Sending…" : "Send OTP"}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.cta, loadingVerify && s.ctaDisabled]}
            onPress={onVerifyOtp}
            disabled={loadingVerify}
            activeOpacity={0.9}
          >
            <Text style={s.ctaText}>
              {loadingVerify ? "Verifying…" : "Verify OTP"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "#F6FAF7",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E6EFE7",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 4,
  },
  caption: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 14,
  },

  label: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },

  phoneWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: "#D6D9D6",
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  ccBadge: {
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 12,
    backgroundColor: "#EAF7ED",
    borderRightWidth: 1,
    borderRightColor: "#D6E7D8",
  },
  ccText: { color: "#1B5E20", fontWeight: "800", fontSize: 13 },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#111",
  },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  otpBox: {
    width: 56,
    height: 56,
    borderWidth: 1.2,
    borderColor: "#D6D9D6",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
  },
  otpFilled: {
    borderColor: "#2E7D32",
    shadowColor: "#2E7D32",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  timerText: { color: "#6B7280", fontSize: 12.5 },
  readyText: { color: "#2E7D32", fontSize: 12.5, fontWeight: "700" },

  resendBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#2E7D32",
    backgroundColor: "#FFFFFF",
  },
  resendBtnDisabled: {
    borderColor: "#C8E6C9",
    backgroundColor: "#F4FBF5",
  },
  resendText: { color: "#2E7D32", fontWeight: "800", fontSize: 12.5 },
  resendTextDisabled: { color: "#9DC6A0" },

  error: {
    color: "#D32F2F",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 2,
    fontWeight: "700",
  },

  cta: {
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ctaDisabled: { backgroundColor: "#A5D6A7" },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
   hint: {
    textAlign: "center",
    color: "#2E7D32",
    fontSize: 12.5,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 2,
  },

});
