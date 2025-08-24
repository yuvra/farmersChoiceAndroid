import React, { useMemo, useRef, useState } from "react";
import {
	Platform,
	TextInput as RNTextInput,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type Address = {
	name: string;
	flat: string;
	street: string;
	city: string;
	district: string;
	state: string;
	pincode: string;
	landmark: string;
	country: string; // forced to "India"
	phone: string;
};

type Props = {
	details: Address;
	onChange: (next: Address) => void;
	onSave: () => void;
	isValid: boolean;
};

/* --- State code → full name map --- */
const STATE_BY_CODE: Record<string, string> = {
	AP: "Andhra Pradesh",
	AR: "Arunachal Pradesh",
	AS: "Assam",
	BR: "Bihar",
	CG: "Chhattisgarh",
	GA: "Goa",
	GJ: "Gujarat",
	HR: "Haryana",
	HP: "Himachal Pradesh",
	JK: "Jammu and Kashmir",
	JH: "Jharkhand",
	KA: "Karnataka",
	KL: "Kerala",
	MP: "Madhya Pradesh",
	MH: "Maharashtra",
	MN: "Manipur",
	ML: "Meghalaya",
	MZ: "Mizoram",
	NL: "Nagaland",
	OR: "Orissa",
	PB: "Punjab",
	RJ: "Rajasthan",
	SK: "Sikkim",
	TN: "Tamil Nadu",
	TR: "Tripura",
	UK: "Uttarakhand",
	UP: "Uttar Pradesh",
	WB: "West Bengal",
	AN: "Andaman and Nicobar Islands",
	CH: "Chandigarh",
	DH: "Dadra and Nagar Haveli",
	DD: "Daman and Diu",
	DL: "Delhi",
	LD: "Lakshadweep",
	PY: "Pondicherry",
};

export default function EnterAddressForm({
	details,
	onChange,
	onSave,
	isValid,
}: Props) {
	// ensure country is always India
	const model = { ...details, country: "India" };

	const nameRef: any = useRef<RNTextInput>(null);
	const pinRef: any = useRef<RNTextInput>(null);
	const flatRef: any = useRef<RNTextInput>(null);
	const streetRef: any = useRef<RNTextInput>(null);
	const landmarkRef: any = useRef<RNTextInput>(null);
	const cityRef: any = useRef<RNTextInput>(null);
	const districtRef: any = useRef<RNTextInput>(null);
	const stateRef: any = useRef<RNTextInput>(null);

	const [pinHint, setPinHint] = useState<string>("");

	const localValid = useMemo(() => {
		const required = [
			"name",
			"pincode",
			"flat",
			"street",
			"city",
			"district",
			"state",
			"country",
		] as const;
		return (
			required.every((k) => (model[k] || "") !== "") &&
			(model.pincode || "").length === 6
		);
	}, [model]);

	// Set raw value (no trimming)
	const setRaw = (k: keyof Address, v: string) =>
		onChange({ ...model, [k]: v, country: "India" });

	// Digits-only helper with max length
	const setDigitsOnly = (k: keyof Address, v: string, max = 4) =>
		setRaw(k, v.replace(/\D/g, "").slice(0, max));

	const fetchPincode = async (pin: string) => {
		try {
			setPinHint("Checking serviceability…");
			const res = await fetch(
				`https://farmers-choice-admin.vercel.app/api/v1/delhivery/pincode?pin_code=${pin}`
			);
			const json = await res.json();
			const pc = json?.delivery_codes?.[0]?.postal_code;
			if (!pc) throw new Error("No data");

			const city = pc.city || "";
			const district = pc.district || "";
			const stateCode = (pc.state_code || "").toUpperCase();
			const stateFull = STATE_BY_CODE[stateCode] || stateCode;

			onChange({
				...model,
				pincode: pin,
				city: city || model.city,
				district: district || model.district,
				state: stateFull || model.state,
				country: "India",
			});

			setPinHint(
				city && district && stateFull
					? `${city}, ${district}, ${stateFull}`
					: "Pincode found"
			);

			flatRef.current?.focus();
		} catch (e) {
			setPinHint("Couldn’t fetch details. Please fill manually.");
		}
	};

	return (
		<View style={{ flex: 1 }}>
			<KeyboardAwareScrollView
				style={{ flex: 1 }}
				contentContainerStyle={s.scrollContent}
				enableOnAndroid
				enableAutomaticScroll
				keyboardShouldPersistTaps="handled"
				extraScrollHeight={Platform.OS === "ios" ? 24 : 80}
				extraHeight={Platform.OS === "ios" ? 0 : 120}
				showsVerticalScrollIndicator={false}
			>
				<View style={s.card}>
					<Text style={s.title}>Complete Your Address</Text>

					{/* Name */}
					<Field
						refInput={nameRef}
						label="Name"
						required
						placeholder="Full name"
						value={model.name}
						onChangeText={(v) => setRaw("name", v)}
						autoCapitalize="none"
						returnKeyType="next"
						onSubmitEditing={() => pinRef.current?.focus()}
					/>

					{/* Pincode (now 6 digits) */}
					<Field
						refInput={pinRef}
						label="Pincode"
						required
						placeholder="4-digit pincode"
						keyboardType="number-pad"
						value={model.pincode}
						onChangeText={(v) => {
							//   const digits = v.replace(/\D/g, "").slice(0, 6);
							// if (isNaN(Number(v))) {
							//     return
							// }
							console.log("***value", v);

							setRaw("pincode", v);
							setPinHint("");
							if (v.length === 6) {
								fetchPincode(v);
							}
						}}
						returnKeyType="next"
						onSubmitEditing={() => flatRef.current?.focus()}
						helpText={pinHint}
					/>

					{/* Flat/Street/Landmark */}
					<Field
						refInput={flatRef}
						label="Flat / House"
						placeholder="e.g., H-1105"
						value={model.flat}
						onChangeText={(v) => setRaw("flat", v)}
						returnKeyType="next"
						onSubmitEditing={() => streetRef.current?.focus()}
					/>

					<Field
						refInput={streetRef}
						label="Street / Area"
						required
						placeholder="Street name / Area"
						value={model.street}
						onChangeText={(v) => setRaw("street", v)}
						autoCapitalize="none"
						returnKeyType="next"
						onSubmitEditing={() => landmarkRef.current?.focus()}
					/>

					<Field
						refInput={landmarkRef}
						label="Landmark"
						placeholder="Near temple, school (optional)"
						value={model.landmark}
						onChangeText={(v) => setRaw("landmark", v)}
						autoCapitalize="none"
						returnKeyType="next"
						onSubmitEditing={() => cityRef.current?.focus()}
					/>

					{/* City / District */}
					<View style={s.row2}>
						<Field
							style={s.col}
							refInput={cityRef}
							label="City"
							required
							placeholder="City"
							value={model.city}
							onChangeText={(v) => setRaw("city", v)}
							autoCapitalize="none"
							returnKeyType="next"
							onSubmitEditing={() => districtRef.current?.focus()}
						/>
						<View style={{ width: 12 }} />
						<Field
							style={s.col}
							refInput={districtRef}
							label="District"
							required
							placeholder="District"
							value={model.district}
							onChangeText={(v) => setRaw("district", v)}
							autoCapitalize="none"
							returnKeyType="next"
							onSubmitEditing={() => stateRef.current?.focus()}
						/>
					</View>

					{/* State */}
					<Field
						refInput={stateRef}
						label="State"
						required
						placeholder="State"
						value={model.state}
						onChangeText={(v) => setRaw("state", v)}
						autoCapitalize="none"
						returnKeyType="done"
					/>

					{/* Country (hard-coded India) */}
					<View style={s.group}>
						<Text style={s.label}>
							COUNTRY <Text style={s.req}>*</Text>
						</Text>
						<View style={[s.input, s.inputDisabled]}>
							<Text style={{ color: "#111", fontSize: 15 }}>
								India
							</Text>
						</View>
					</View>

					{!localValid && (
						<Text style={s.hint}>
							Please fill all required fields and enter a valid
							6-digit pincode.
						</Text>
					)}

					<TouchableOpacity
						style={[
							s.btn,
							!(isValid && localValid) && s.btnDisabled,
						]}
						onPress={onSave}
						disabled={!(isValid && localValid)}
					>
						<Text style={s.btnText}>Save Address</Text>
					</TouchableOpacity>
				</View>
			</KeyboardAwareScrollView>
		</View>
	);
}

/* ---------- Reusable Field ---------- */
type FieldProps = {
	label: string;
	value: string;
	onChangeText: (v: string) => void;
	placeholder?: string;
	required?: boolean;
	refInput?: React.RefObject<RNTextInput>;
	autoCapitalize?: "none" | "sentences" | "words" | "characters";
	keyboardType?: "default" | "number-pad" | "email-address" | "phone-pad";
	returnKeyType?: "done" | "next" | "go" | "search" | "send";
	onSubmitEditing?: () => void;
	style?: any;
	helpText?: string;
};
function Field({
	label,
	value,
	onChangeText,
	placeholder,
	required,
	refInput,
	autoCapitalize = "none",
	keyboardType = "default",
	returnKeyType = "done",
	onSubmitEditing,
	style,
	helpText,
}: FieldProps) {
	return (
		<View style={[s.group, style]}>
			<Text style={s.label}>
				{label.toUpperCase()} {required && <Text style={s.req}>*</Text>}
			</Text>
			<RNTextInput
				ref={refInput as any}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor="#9E9E9E"
				style={s.input}
				autoCapitalize={autoCapitalize}
				keyboardType={keyboardType}
				returnKeyType={returnKeyType}
				onSubmitEditing={onSubmitEditing}
				maxLength={label.toUpperCase() === "PINCODE" ? 6 : 20}
			/>
			{!!helpText && <Text style={s.help}>{helpText}</Text>}
		</View>
	);
}

/* ---------- Styles ---------- */
const s = StyleSheet.create({
	scrollContent: {
		flexGrow: 1,
		padding: 16,
		paddingBottom: 24,
	},
	card: {
		backgroundColor: "#FFFFFF",
		padding: 16,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#EDF0ED",
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
		marginBottom: 8,
	},

	group: { marginBottom: 12 },
	label: {
		fontSize: 12.5,
		fontWeight: "700",
		color: "#4B5563",
		marginBottom: 6,
	},
	req: { color: "#E53935" },

	input: {
		borderWidth: 1.2,
		borderColor: "#D6D9D6",
		backgroundColor: "#FAFAFA",
		borderRadius: 10,
		paddingVertical: 12,
		paddingHorizontal: 14,
		fontSize: 15,
		color: "#111",
	},
	inputDisabled: {
		backgroundColor: "#F5F5F5",
		borderColor: "#E0E0E0",
	},

	row2: { flexDirection: "row", alignItems: "flex-start" },
	col: { flex: 1 },

	help: { color: "#6B7280", fontSize: 12, marginTop: 4 },
	hint: { color: "#9E9E9E", fontSize: 12.5, marginTop: 2, marginBottom: 10 },

	btn: {
		backgroundColor: "#2E7D32",
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
	btnDisabled: { backgroundColor: "#A5D6A7" },
});
