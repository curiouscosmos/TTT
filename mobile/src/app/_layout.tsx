import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { StoreProvider } from '@/stores/rootStore';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000,
      retry: 1,
      staleTime: 30 * 1000,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      {/* One root QueryClient keeps server state, cache invalidation, and refetching
          consistent across every Expo Router screen. Do not mirror API data in MobX. */}
      <StoreProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          {/* Expo Router maps these file names to routes; nested files under retainers/[id]
              are detail-flow screens, so a Stack is the smallest useful navigator here. */}
          <Stack>
            <Stack.Screen name="index" options={{ title: 'Retainers' }} />
            <Stack.Screen name="at-risk" options={{ title: 'At-Risk' }} />
            <Stack.Screen name="retainers/new" options={{ title: 'Create Retainer' }} />
            <Stack.Screen name="retainers/[id]/index" options={{ title: 'Retainer Detail' }} />
            <Stack.Screen name="retainers/[id]/edit" options={{ title: 'Edit Retainer' }} />
            <Stack.Screen name="retainers/[id]/check-in" options={{ title: 'Add Check-in' }} />
          </Stack>
        </ThemeProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}
