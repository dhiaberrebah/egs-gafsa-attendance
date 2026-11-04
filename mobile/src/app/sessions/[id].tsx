import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ActionButton, AppHeader, LoadingView, MessageCard, Screen, SectionTitle } from "@/components/ui";
import type { AttendanceParticipant, AttendanceSheet, AttendanceStatus } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { formatSessionDate, getMessages } from "@/lib/i18n";
import type { Locale, Messages } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

const statuses: AttendanceStatus[] = ["PRESENT", "LATE", "ABSENT", "EXCUSED", "INJURED"];
const noParticipants: AttendanceParticipant[] = [];

function friendlyError(error: unknown, messages: Messages, unmarked: number) {
  if (error instanceof ApiError) {
    if (error.code === "NETWORK_ERROR") return messages.networkError;
    if (error.code === "INCOMPLETE_ATTENDANCE") return messages.incomplete.replace("{count}", String(unmarked));
    if (error.code === "SESSION_NOT_EDITABLE") return messages.sessionReadOnly;
  }
  return messages.invalid;
}

function personName(person: AttendanceParticipant) {
  return `${person.firstName} ${person.lastName}`;
}

function statusTone(status: AttendanceStatus) {
  if (status === "PRESENT") return { backgroundColor: colors.greenWash, borderColor: "#BED6C3", textColor: colors.green };
  if (status === "LATE") return { backgroundColor: "#FFF4D2", borderColor: "#E8D389", textColor: "#785A0A" };
  if (status === "ABSENT") return { backgroundColor: colors.redWash, borderColor: "#F0C8C3", textColor: colors.red };
  if (status === "EXCUSED") return { backgroundColor: colors.slateWash, borderColor: "#D5DCE0", textColor: colors.slate };
  return { backgroundColor: colors.orangeWash, borderColor: "#EBD1B0", textColor: colors.orange };
}

function AttendancePerson({
  person,
  selected,
  note,
  locale,
  messages,
  disabled,
  onSelect,
  onNoteChange,
}: {
  person: AttendanceParticipant;
  selected?: AttendanceStatus;
  note: string;
  locale: Locale;
  messages: Messages;
  disabled: boolean;
  onSelect: (status: AttendanceStatus) => void;
  onNoteChange: (value: string) => void;
}) {
  return <View style={styles.personCard}>
    <Text style={[styles.personName, locale === "ar" && styles.textRtl]}>{personName(person)}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusOptions}>
      {statuses.map((status) => {
        const tone = statusTone(status);
        const active = selected === status;
        return <Pressable
          key={status}
          accessibilityRole="button"
          accessibilityState={{ selected: active, disabled }}
          disabled={disabled}
          onPress={() => onSelect(status)}
          style={[
            styles.statusOption,
            active ? { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor } : styles.statusOptionIdle,
            disabled && styles.disabled,
          ]}
        >
          <Text style={[styles.statusOptionText, active && { color: tone.textColor }]}>
            {messages.attendanceStatuses[status]}
          </Text>
        </Pressable>;
      })}
    </ScrollView>
    {!selected ? <Text style={[styles.unmarked, locale === "ar" && styles.textRtl]}>{messages.unmarked}</Text> : null}
    <TextInput
      value={note}
      onChangeText={onNoteChange}
      editable={!disabled}
      placeholder={messages.note}
      placeholderTextColor={colors.muted}
      multiline
      maxLength={500}
      style={[styles.noteInput, locale === "ar" && styles.inputRtl, disabled && styles.disabled]}
    />
  </View>;
}

export default function AttendanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, ready, locale, toggleLocale, signOut, request } = useApp();
  const messages = getMessages(locale);
  const [sheet, setSheet] = useState<AttendanceSheet | null>(null);
  const [selection, setSelection] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      const result = await request<AttendanceSheet>(`/api/v1/coach/sessions/${encodeURIComponent(id)}/attendance`);
      setSheet(result);
      setSelection(Object.fromEntries(result.records.map((record) => [record.userId, record.status])));
      setNotes(Object.fromEntries(result.records.map((record) => [record.userId, record.note ?? ""])));
      setError("");
    } catch (cause) {
      setError(friendlyError(cause, messages, 0));
    } finally {
      setLoading(false);
    }
  }, [id, token, request, messages]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [token, load]);

  const participants = sheet?.participants ?? noParticipants;
  const players = useMemo(() => participants.filter((person) => person.role === "PLAYER"), [participants]);
  const staff = useMemo(() => participants.filter((person) => person.role !== "PLAYER"), [participants]);
  const markedCount = participants.reduce((count, person) => count + (selection[person.id] ? 1 : 0), 0);
  const unmarkedCount = participants.length - markedCount;
  const readOnly = sheet?.session.status === "LOCKED" || sheet?.session.status === "CANCELLED";

  if (!ready) return <LoadingView label={messages.loading} locale={locale} />;
  if (!token) return <Redirect href="/" />;

  async function save(intent: "draft" | "submit") {
    if (!sheet) return;
    if (intent === "submit" && unmarkedCount > 0) {
      setError(messages.incomplete.replace("{count}", String(unmarkedCount)));
      setSuccess("");
      return;
    }
    setPending(true);
    setError("");
    setSuccess("");
    const entries = participants.flatMap((person) => {
      const status = selection[person.id];
      return status ? [{
        userId: person.id,
        status,
        note: notes[person.id]?.trim() || null,
      }] : [];
    });
    try {
      await request(`/api/v1/coach/sessions/${encodeURIComponent(sheet.session.id)}/attendance`, {
        method: "POST",
        body: JSON.stringify({ intent, entries }),
      });
      if (intent === "submit" && sheet.session.status === "DRAFT") {
        setSheet((current) => current ? { ...current, session: { ...current.session, status: "SUBMITTED" } } : current);
      }
      setSuccess(intent === "submit" ? messages.submitted : messages.draftSaved);
    } catch (cause) {
      setError(friendlyError(cause, messages, unmarkedCount));
    } finally {
      setPending(false);
    }
  }

  if (loading && !sheet) return <LoadingView label={messages.loading} locale={locale} />;

  return <Screen>
    <AppHeader
      title={sheet ? (locale === "ar" ? sheet.session.category.nameAr : sheet.session.category.nameFr) : messages.markAttendance}
      subtitle={sheet ? `${messages.sessionTypes[sheet.session.type as keyof typeof messages.sessionTypes]} · ${formatSessionDate(sheet.session.startsAt, locale)}` : undefined}
      locale={locale}
      labels={messages}
      onToggleLocale={toggleLocale}
      onSignOut={() => void signOut()}
    />
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()} style={styles.backLink} accessibilityRole="button">
        <Text style={[styles.backText, locale === "ar" && styles.textRtl]}>{messages.back}</Text>
      </Pressable>
      {error ? <MessageCard>{error}</MessageCard> : null}
      {success ? <MessageCard tone="success">{success}</MessageCard> : null}
      {sheet ? <>
        <View style={styles.progressCard}>
          <View style={[styles.progressHeader, locale === "ar" && styles.rowRtl]}>
            <Text style={[styles.progressLabel, locale === "ar" && styles.textRtl]}>
              {messages.marked.replace("{marked}", String(markedCount)).replace("{total}", String(participants.length))}
            </Text>
            {!readOnly ? <Pressable onPress={() => {
              setSelection(Object.fromEntries(participants.map((person) => [person.id, "PRESENT"])));
            }} style={styles.markAll} accessibilityRole="button">
              <Text style={styles.markAllText}>{messages.markAllPresent}</Text>
            </Pressable> : null}
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${participants.length ? Math.round(markedCount / participants.length * 100) : 0}%` }]} /></View>
        </View>
        {readOnly ? <MessageCard tone="info">{messages.sessionReadOnly}</MessageCard> : null}
        {players.length ? <>
          <SectionTitle locale={locale}>{messages.players}</SectionTitle>
          {players.map((person) => <AttendancePerson
            key={person.id}
            person={person}
            selected={selection[person.id]}
            note={notes[person.id] ?? ""}
            locale={locale}
            messages={messages}
            disabled={Boolean(readOnly) || pending}
            onSelect={(status) => setSelection((current) => ({ ...current, [person.id]: status }))}
            onNoteChange={(value) => setNotes((current) => ({ ...current, [person.id]: value }))}
          />)}
        </> : null}
        {staff.length ? <>
          <SectionTitle locale={locale}>{messages.staff}</SectionTitle>
          {staff.map((person) => <AttendancePerson
            key={person.id}
            person={person}
            selected={selection[person.id]}
            note={notes[person.id] ?? ""}
            locale={locale}
            messages={messages}
            disabled={Boolean(readOnly) || pending}
            onSelect={(status) => setSelection((current) => ({ ...current, [person.id]: status }))}
            onNoteChange={(value) => setNotes((current) => ({ ...current, [person.id]: value }))}
          />)}
        </> : null}
        {!readOnly ? <View style={styles.actions}>
          <ActionButton label={messages.saveDraft} variant="secondary" onPress={() => void save("draft")} disabled={pending} />
          <ActionButton label={pending ? messages.loading : messages.submit} onPress={() => void save("submit")} disabled={pending} />
        </View> : null}
      </> : !loading ? <MessageCard>{error || messages.invalid}</MessageCard> : null}
    </ScrollView>
  </Screen>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16, paddingBottom: 38, gap: 12 },
  backLink: { minHeight: 34, justifyContent: "center", alignSelf: "flex-start", paddingHorizontal: 3 },
  backText: { color: colors.green, fontSize: 13, fontWeight: "800" },
  rowRtl: { flexDirection: "row-reverse" },
  textRtl: { textAlign: "right", writingDirection: "rtl" },
  progressCard: { padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, gap: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 9 },
  progressLabel: { flex: 1, color: colors.forestDeep, fontSize: 13, fontWeight: "900" },
  markAll: { minHeight: 38, paddingHorizontal: 11, borderRadius: 11, backgroundColor: colors.greenWash, alignItems: "center", justifyContent: "center" },
  markAllText: { color: colors.green, fontSize: 11, fontWeight: "900" },
  progressTrack: { height: 6, overflow: "hidden", borderRadius: 4, backgroundColor: "#E8E8E1" },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: colors.green },
  personCard: { padding: 13, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, gap: 10 },
  personName: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  statusOptions: { flexDirection: "row", gap: 7, paddingEnd: 8 },
  statusOption: { minHeight: 37, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  statusOptionIdle: { backgroundColor: "#FFFFFF", borderColor: colors.border },
  statusOptionText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  unmarked: { color: "#946D15", fontSize: 11, fontWeight: "700" },
  noteInput: { minHeight: 40, maxHeight: 80, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.ink, backgroundColor: "#FBFAF5", fontSize: 12, textAlignVertical: "top" },
  inputRtl: { textAlign: "right", writingDirection: "rtl" },
  disabled: { opacity: 0.55 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
});
