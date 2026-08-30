import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRetainer } from '@/api/client';
import { getQueryErrorMessage } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import { EmptyState, ErrorState, LoadingState } from '@/components/screen-state';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CheckIn, HealthStatus, RetainerDetail } from '@/types/api';

export default function RetainerDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  // Expo Router can surface repeated params as arrays. This route only accepts
  // one retainer id, so normalize before building query keys or API paths.
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: id ? queryKeys.retainers.detail(id) : queryKeys.retainers.detail('missing-id'),
    queryFn: () => getRetainer(id ?? ''),
    enabled: Boolean(id),
  });

  if (!id) {
    return (
      <ScreenShell>
        <EmptyState title="Missing retainer" message="This route needs a retainer id." />
      </ScreenShell>
    );
  }

  if (isLoading) {
    return (
      <ScreenShell>
        <LoadingState message="Loading retainer..." />
      </ScreenShell>
    );
  }

  if (error || !data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Could not load retainer"
          message={getQueryErrorMessage(error, {
            notFoundMessage: 'The requested retainer could not be found.',
          })}
          onRetry={() => void refetch()}
        />
      </ScreenShell>
    );
  }

  return <RetainerDetailContent retainer={data} />;
}

function RetainerDetailContent({ retainer }: { retainer: RetainerDetail }) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <ThemedText type="subtitle">{retainer.clientName}</ThemedText>
            <View style={styles.actionRow}>
              <Button
                label="Edit Retainer"
                onPress={() =>
                  router.push({ pathname: '/retainers/[id]/edit', params: { id: retainer.id } })
                }
              />
              <Button
                label="Add Check-in"
                onPress={() =>
                  router.push({
                    pathname: '/retainers/[id]/check-in',
                    params: { id: retainer.id },
                  })
                }
                variant="secondary"
              />
            </View>
          </View>

          <HealthPanel status={retainer.health.status} reason={retainer.health.reason} />

          <View style={styles.section}>
            <InfoRow label="Lead engineer" value={retainer.leadEngineer} />
            <InfoRow label="Start date" value={formatDate(retainer.startDate)} />
            <InfoRow label="Status" value={retainer.status} />
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold">Recent check-ins</ThemedText>
            {retainer.checkIns.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                No check-ins yet.
              </ThemedText>
            ) : (
              retainer.checkIns.map((checkIn) => <CheckInCard key={checkIn.id} checkIn={checkIn} />)
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </ThemedView>
  );
}

function HealthPanel({ status, reason }: { status: HealthStatus; reason: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.healthPanel, { backgroundColor: theme.backgroundElement }]}>
      <StatusBadge kind="health" status={status} />
      <ThemedText type="smallBold">Health</ThemedText>
      {/* Health is computed by the API so the mobile client does not duplicate
          backend rules or drift from server behavior. */}
      <ThemedText>{reason}</ThemedText>
    </View>
  );
}

function CheckInCard({ checkIn }: { checkIn: CheckIn }) {
  const theme = useTheme();

  return (
    <View style={[styles.checkInCard, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.checkInHeader}>
        <ThemedText type="smallBold">{formatDate(checkIn.date)}</ThemedText>
        <StatusBadge kind="rag" status={checkIn.ragStatus} />
      </View>
      <ThemedText>{checkIn.summary}</ThemedText>
      {checkIn.riskNote ? (
        <ThemedText type="small" themeColor="textSecondary">
          Risk: {checkIn.riskNote}
        </ThemedText>
      ) : null}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

function Button({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.button, { backgroundColor: isPrimary ? theme.text : theme.backgroundElement }]}>
      <ThemedText type="smallBold" style={{ color: isPrimary ? theme.background : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function formatDate(date: string) {
  // API dates are ISO strings; display uses the device locale and intentionally
  // avoids timezone math until product requirements need exact date semantics.
  return new Date(date).toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  header: {
    gap: Spacing.three,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  healthPanel: {
    borderRadius: 8,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  infoRow: {
    gap: Spacing.half,
  },
  checkInCard: {
    borderRadius: 8,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  checkInHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  button: {
    minHeight: 44,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
