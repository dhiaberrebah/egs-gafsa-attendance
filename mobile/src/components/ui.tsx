import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Locale, Messages } from "@/lib/i18n";
import { colors } from "@/lib/theme";

export function Screen({ children }: { children: React.ReactNode }) {
  return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>{children}</SafeAreaView>;
}

export function AppHeader({
  title,
  subtitle,
  locale,
  labels,
  onToggleLocale,
  onSignOut,
}: {
  title: string;
  subtitle?: string;
  locale: Locale;
  labels: Messages;
  onToggleLocale: () => void;
  onSignOut?: () => void;
}) {
  return <View style={[styles.header, locale === "ar" && styles.headerRtl]}>
    <View style={[styles.headerBrand, locale === "ar" && styles.headerBrandRtl]}>
      <Image source={require("../../assets/egs-gafsa-logo.png")} style={styles.headerLogo} resizeMode="contain" accessibilityLabel={labels.appName} />
      <View style={styles.headerCopy}>
        <Text style={[styles.headerTitle, locale === "ar" && styles.textRtl]}>{title}</Text>
        {subtitle ? <Text style={[styles.headerSubtitle, locale === "ar" && styles.textRtl]}>{subtitle}</Text> : null}
      </View>
    </View>
    <View style={styles.headerActions}>
      <Pressable onPress={onToggleLocale} style={styles.headerChip} accessibilityRole="button">
        <Text style={styles.headerChipText}>{locale === "ar" ? "FR" : "عربي"}</Text>
      </Pressable>
      {onSignOut ? <Pressable onPress={onSignOut} style={styles.headerChip} accessibilityRole="button">
        <Text style={styles.headerChipText}>{labels.signOut}</Text>
      </Pressable> : null}
    </View>
  </View>;
}

export function ActionButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "quiet";
}) {
  return <Pressable
    accessibilityRole="button"
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionButton,
      variant === "primary" ? styles.actionPrimary : variant === "secondary" ? styles.actionSecondary : styles.actionQuiet,
      pressed && !disabled && styles.actionPressed,
      disabled && styles.actionDisabled,
    ]}
  >
    <Text style={[styles.actionText, variant === "primary" && styles.actionPrimaryText]}>{label}</Text>
  </Pressable>;
}

export function MessageCard({ children, tone = "error" }: { children: string; tone?: "error" | "success" | "info" }) {
  return <View style={[styles.messageCard, tone === "error" ? styles.errorCard : tone === "success" ? styles.successCard : styles.infoCard]}>
    <Text style={[styles.messageText, tone === "error" ? styles.errorText : tone === "success" ? styles.successText : styles.infoText]}>{children}</Text>
  </View>;
}

export function LoadingView({ label, locale }: { label: string; locale: Locale }) {
  return <Screen>
    <View style={styles.loading}>
      <View style={styles.loadingMark}><View style={styles.loadingDot} /></View>
      <Text style={[styles.loadingText, locale === "ar" && styles.textRtl]}>{label}</Text>
    </View>
  </Screen>;
}

export function SectionTitle({ children, locale }: { children: string; locale: Locale }) {
  return <Text style={[styles.sectionTitle, locale === "ar" && styles.textRtl]}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.forest },
  header: {
    minHeight: 90,
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: colors.forest,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerRtl: { flexDirection: "row-reverse" },
  headerBrand: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 },
  headerBrandRtl: { flexDirection: "row-reverse" },
  headerLogo: { width: 35, height: 48 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  headerSubtitle: { color: "#D9E6DC", fontSize: 12, marginTop: 3 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerChip: { minHeight: 36, justifyContent: "center", paddingHorizontal: 10, borderWidth: 1, borderColor: "#547361", borderRadius: 12 },
  headerChipText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  textRtl: { textAlign: "right", writingDirection: "rtl" },
  actionButton: { minHeight: 48, borderRadius: 14, paddingHorizontal: 17, alignItems: "center", justifyContent: "center" },
  actionPrimary: { backgroundColor: colors.forest },
  actionSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  actionQuiet: { backgroundColor: colors.greenWash },
  actionPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  actionDisabled: { opacity: 0.55 },
  actionText: { color: colors.forest, fontSize: 15, fontWeight: "800" },
  actionPrimaryText: { color: "#FFFFFF" },
  messageCard: { borderRadius: 12, padding: 13, borderWidth: 1 },
  errorCard: { backgroundColor: colors.redWash, borderColor: "#F0C8C3" },
  successCard: { backgroundColor: colors.greenWash, borderColor: "#BED6C3" },
  infoCard: { backgroundColor: "#FFF7DF", borderColor: "#E9D89F" },
  messageText: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  errorText: { color: colors.red },
  successText: { color: colors.green },
  infoText: { color: colors.forest },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingMark: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: "#CFDACE", borderTopColor: colors.green, alignItems: "flex-end", justifyContent: "flex-start", padding: 2 },
  loadingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.yellow },
  loadingText: { color: colors.muted, fontWeight: "600" },
  sectionTitle: { color: colors.forestDeep, fontSize: 17, fontWeight: "800", marginBottom: 2 },
});
