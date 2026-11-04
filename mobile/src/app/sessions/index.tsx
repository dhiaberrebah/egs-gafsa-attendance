import { Redirect, router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppHeader, LoadingView, MessageCard, Screen } from "@/components/ui";
import type { CoachSession } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { formatSessionDate, getMessages } from "@/lib/i18n";
import type { Locale, Messages } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

type Category = { id: string; nameFr: string; nameAr: string };

function categoryName(category: Pick<Category, "nameFr" | "nameAr">, locale: Locale) {
  return locale === "ar" ? category.nameAr : category.nameFr;
}

function statusColor(status: CoachSession["status"]) {
  if (status === "SUBMITTED") return { backgroundColor: colors.greenWash, color: colors.green };
  if (status === "LOCKED") return { backgroundColor: colors.forest, color: "#FFFFFF" };
  if (status === "CANCELLED") return { backgroundColor: colors.redWash, color: colors.red };
  return { backgroundColor: "#ECEDE8", color: colors.muted };
}

function friendlyError(error: unknown, messages: Messages) {
  if (error instanceof ApiError && error.code === "NETWORK_ERROR") return messages.networkError;
  return messages.invalid;
}

export default function SessionsScreen() {
  const { token, ready, locale, toggleLocale, signOut, request } = useApp();
  const messages = getMessages(locale);
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [sessionData, categoryData] = await Promise.all([
        request<{ sessions: CoachSession[] }>("/api/v1/coach/sessions"),
        request<{ categories: Category[] }>("/api/v1/coach/categories"),
      ]);
      setSessions(sessionData.sessions);
      setCategories(categoryData.categories);
      setError("");
    } catch (cause) {
      setError(friendlyError(cause, messages));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, request, messages]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [token, load]);

  const visibleSessions = useMemo(
    () => selectedCategory ? sessions.filter((session) => session.categoryId === selectedCategory) : sessions,
    [sessions, selectedCategory],
  );

  if (!ready) return <LoadingView label={messages.loading} locale={locale} />;
  if (!token) return <Redirect href="/" />;

  return <Screen>
    <AppHeader
      title={messages.sessionsTitle}
      subtitle={messages.subtitle}
      locale={locale}
      labels={messages}
      onToggleLocale={toggleLocale}
      onSignOut={() => void signOut()}
    />
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.green} colors={[colors.green]} />}
    >
      <View style={[styles.sectionHeading, locale === "ar" && styles.rowRtl]}>
        <View>
          <Text style={[styles.eyebrow, locale === "ar" && styles.textRtl]}>{messages.coachApp}</Text>
          <Text style={[styles.heading, locale === "ar" && styles.textRtl]}>{messages.sessionsTitle}</Text>
        </View>
        <Pressable onPress={() => { setRefreshing(true); void load(); }} style={styles.refreshButton} accessibilityRole="button">
          <Text style={styles.refreshText}>{messages.refresh}</Text>
        </Pressable>
      </View>

      <View style={styles.filterBlock}>
        <Text style={[styles.filterLabel, locale === "ar" && styles.textRtl]}>{messages.categories}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <CategoryChip
            label={messages.allCategories}
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
          />
          {categories.map((category) => <CategoryChip
            key={category.id}
            label={categoryName(category, locale)}
            selected={selectedCategory === category.id}
            onPress={() => setSelectedCategory(category.id)}
          />)}
        </ScrollView>
      </View>

      {error ? <MessageCard>{error}</MessageCard> : null}
      {loading && sessions.length === 0 ? <Text style={styles.loadingText}>{messages.loading}</Text> : null}
      {!loading && visibleSessions.length === 0 ? <View style={styles.empty}>
        <View style={styles.emptyMark}><Text style={styles.emptyMarkText}>EGS</Text></View>
        <Text style={[styles.emptyTitle, locale === "ar" && styles.textRtl]}>{messages.noSessions}</Text>
      </View> : null}

      <View style={styles.sessionList}>
        {visibleSessions.map((session) => {
          const badge = statusColor(session.status);
          return <Pressable
            key={session.id}
            onPress={() => router.push({ pathname: "/sessions/[id]", params: { id: session.id } })}
            style={({ pressed }) => [styles.sessionCard, pressed && styles.cardPressed]}
            accessibilityRole="button"
          >
            <View style={[styles.sessionTop, locale === "ar" && styles.rowRtl]}>
              <Text style={[styles.category, locale === "ar" && styles.textRtl]}>{categoryName(session.category, locale)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
                <Text style={[styles.statusText, { color: badge.color }]}>{messages.sessionStatuses[session.status]}</Text>
              </View>
            </View>
            <Text style={[styles.sessionType, locale === "ar" && styles.textRtl]}>{messages.sessionTypes[session.type]}</Text>
            <View style={[styles.sessionBottom, locale === "ar" && styles.rowRtl]}>
              <Text style={styles.date}>{formatSessionDate(session.startsAt, locale)}</Text>
              <Text style={styles.count}>{messages.attendanceCount.replace("{count}", String(session.attendanceCount))}</Text>
            </View>
            {session.location ? <Text style={[styles.location, locale === "ar" && styles.textRtl]}>{session.location}</Text> : null}
          </Pressable>;
        })}
      </View>
    </ScrollView>
  </Screen>;
}

function CategoryChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.categoryChip, selected && styles.categoryChipSelected]} accessibilityRole="button">
    <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 18, paddingBottom: 36, gap: 20 },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 10 },
  rowRtl: { flexDirection: "row-reverse" },
  eyebrow: { color: colors.green, fontSize: 10, letterSpacing: 2, fontWeight: "900" },
  heading: { color: colors.forestDeep, fontSize: 29, lineHeight: 34, fontWeight: "900", marginTop: 4 },
  textRtl: { textAlign: "right", writingDirection: "rtl" },
  refreshButton: { minHeight: 38, paddingHorizontal: 12, justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card },
  refreshText: { color: colors.green, fontSize: 12, fontWeight: "800" },
  filterBlock: { gap: 9 },
  filterLabel: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  filters: { flexDirection: "row", gap: 8, paddingEnd: 10 },
  categoryChip: { minHeight: 38, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  categoryChipSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  categoryChipText: { color: colors.forest, fontSize: 12, fontWeight: "800" },
  categoryChipTextSelected: { color: "#FFFFFF" },
  loadingText: { color: colors.muted, paddingVertical: 20, textAlign: "center" },
  empty: { minHeight: 210, alignItems: "center", justifyContent: "center", padding: 24, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: "#FBFAF5", gap: 12 },
  emptyMark: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.greenWash, alignItems: "center", justifyContent: "center" },
  emptyMarkText: { color: colors.green, fontSize: 14, fontWeight: "900" },
  emptyTitle: { color: colors.muted, fontWeight: "700", textAlign: "center", lineHeight: 22, maxWidth: 270 },
  sessionList: { gap: 12 },
  sessionCard: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderStartWidth: 5, borderStartColor: colors.yellow },
  cardPressed: { opacity: 0.83 },
  sessionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  category: { flex: 1, color: colors.forestDeep, fontSize: 17, fontWeight: "900" },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 10, fontWeight: "900" },
  sessionType: { color: colors.green, fontSize: 13, fontWeight: "700", marginTop: 7 },
  sessionBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 15 },
  date: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  count: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  location: { color: colors.muted, fontSize: 12, marginTop: 9 },
});
