import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { AppProvider } from "@/providers/app-provider";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return <SafeAreaProvider style={styles.provider}>
    <AppProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
    </AppProvider>
  </SafeAreaProvider>;
}

const styles = StyleSheet.create({
  provider: { flex: 1, backgroundColor: colors.forest },
});
