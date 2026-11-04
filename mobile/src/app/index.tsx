import { Redirect } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ActionButton, LoadingView, MessageCard, Screen } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getMessages } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

export default function LoginScreen() {
  const { token, ready, locale, toggleLocale, signIn } = useApp();
  const messages = getMessages(locale);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!ready) return <LoadingView label={messages.loading} locale={locale} />;
  if (token) return <Redirect href="/sessions" />;

  async function handleSignIn() {
    setError("");
    setPending(true);
    try {
      await signIn(username.trim(), password);
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "API_URL_NOT_CONFIGURED") setError(messages.apiMissing);
      else if (cause instanceof ApiError && cause.code === "NETWORK_ERROR") setError(messages.networkError);
      else if (cause instanceof ApiError && cause.code === "COACH_ONLY") setError(messages.coachOnly);
      else setError(messages.loginError);
    } finally {
      setPending(false);
    }
  }

  return <Screen>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={[styles.heroTop, locale === "ar" && styles.heroTopRtl]}>
            <Image source={require("../../assets/egs-gafsa-logo.png")} style={styles.crest} resizeMode="contain" accessibilityLabel={messages.appName} />
            <Pressable onPress={toggleLocale} style={styles.languageButton} accessibilityRole="button">
              <Text style={styles.languageText}>{locale === "ar" ? "FR" : "عربي"}</Text>
            </Pressable>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{messages.coachApp}</Text>
            <Text style={[styles.title, locale === "ar" && styles.textRtl]}>{messages.loginTitle}</Text>
            <Text style={[styles.subtitle, locale === "ar" && styles.textRtl]}>{messages.loginHint}</Text>
          </View>
          <View style={styles.heroRule}><View style={styles.heroRuleInner} /></View>
          <Text style={styles.founded}>GAFSA · DEPUIS 1967</Text>
        </View>

        <View style={styles.formWrap}>
          <View style={styles.form}>
            <Text style={[styles.formTitle, locale === "ar" && styles.textRtl]}>{messages.login}</Text>
            <View style={styles.field}>
              <Text style={[styles.label, locale === "ar" && styles.textRtl]}>{messages.username}</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                style={[styles.input, locale === "ar" && styles.inputRtl]}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, locale === "ar" && styles.textRtl]}>{messages.password}</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => void handleSignIn()}
                style={[styles.input, locale === "ar" && styles.inputRtl]}
              />
            </View>
            {error ? <MessageCard>{error}</MessageCard> : null}
            <ActionButton
              label={pending ? messages.signingIn : messages.login}
              onPress={() => void handleSignIn()}
              disabled={pending || !username.trim() || !password}
            />
          </View>
          <Text style={[styles.footer, locale === "ar" && styles.textRtl]}>EL GAWAFEL SPORTIVES DE GAFSA</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </Screen>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: colors.paper },
  hero: { minHeight: 355, backgroundColor: colors.forest, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 30 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroTopRtl: { flexDirection: "row-reverse" },
  crest: { height: 92, width: 70 },
  languageButton: { borderColor: "#6D8B78", borderWidth: 1, borderRadius: 14, minWidth: 52, height: 40, alignItems: "center", justifyContent: "center" },
  languageText: { color: "#FFFFFF", fontWeight: "800" },
  heroCopy: { marginTop: 23 },
  eyebrow: { color: colors.yellow, fontSize: 11, letterSpacing: 2.2, fontWeight: "900" },
  title: { color: "#FFFFFF", fontSize: 32, lineHeight: 39, fontWeight: "900", marginTop: 11, maxWidth: 330 },
  subtitle: { color: "#D6E3D9", fontSize: 15, marginTop: 9, lineHeight: 22 },
  textRtl: { textAlign: "right", writingDirection: "rtl" },
  heroRule: { height: 2, backgroundColor: "#466451", marginTop: 27, width: "100%" },
  heroRuleInner: { height: 2, width: 58, backgroundColor: colors.yellow },
  founded: { marginTop: 12, color: "#A8BBAE", fontSize: 10, letterSpacing: 1.5, fontWeight: "700" },
  formWrap: { flex: 1, marginTop: -18, backgroundColor: colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 26, paddingBottom: 22 },
  form: { gap: 18 },
  formTitle: { fontSize: 20, fontWeight: "900", color: colors.forestDeep, marginBottom: 1 },
  field: { gap: 8 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  input: { minHeight: 51, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 13, paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  inputRtl: { textAlign: "right", writingDirection: "rtl" },
  footer: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.1, textAlign: "center", marginTop: 27 },
});
