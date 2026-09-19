import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import { BackendAPI } from '../api/backend';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { NotificationNavigation } from '../notifications/NotificationNavigation';
import {
  BookingDetailsScreen,
  ChatChannelScreen,
  ConnectionsScreen,
  CreatePostScreen,
  EventDetailsScreen,
  EventRegisterScreen,
  EventTicketScreen,
  EventWorkspaceScreen,
  FullTicketScreen,
  LocationScreen,
  LoginScreen,
  MyBookingsScreen,
  NotificationsScreen,
  PostDetailsScreen,
  ProfileScreen,
  PublicProfileScreen,
  RegistrationSuccessScreen,
  RegistrationSummaryScreen,
  SearchScreen,
  SignUpScreen,
  SportsInterestScreen,
  SupportScreen,
  TournamentDetailsScreen,
  TournamentRegisterScreen,
  TournamentRegistrationSuccessScreen,
  TournamentRegistrationSummaryScreen,
  VenueBookingReviewScreen,
  VenueBookingSuccessScreen,
  VenueDetailsScreen,
} from '../screens';

const Stack = createNativeStackNavigator();

export const RootNavigator = ({ signedIn }: { signedIn: boolean }) => {
  const [onboardingStep, setOnboardingStep] = useState<string>('COMPLETE');
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState('');
  const [startupAttempt, setStartupAttempt] = useState(0);
  const [navigationReady, setNavigationReady] = useState(false);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (!signedIn) {
      setLoading(false);
      setStartupError('');
      return;
    }
    let active = true;
    const initialize = async () => {
      setLoading(true);
      setStartupError('');
      try {
        const result = await BackendAPI.getMe();
        if (active) {
          setOnboardingStep(
            result.profile.onboardingComplete
              ? 'COMPLETE'
              : result.profile.onboardingStep,
          );
        }
      } catch (apiError: any) {
        if (active) setStartupError(apiError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    initialize();
    return () => {
      active = false;
    };
  }, [signedIn, startupAttempt]);

  if (!signedIn)
    return (
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'ios_from_right',
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  if (loading)
    return (
      <View style={center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  if (startupError)
    return (
      <View style={center}>
        <Text style={errorTitle}>Unable to connect</Text>
        <Text style={errorText}>{startupError}</Text>
        <Button
          title="Try Again"
          onPress={() => {
            setStartupError('');
            setLoading(true);
            setStartupAttempt(attempt => attempt + 1);
          }}
          style={retryButton}
        />
      </View>
    );
  const initialRoute =
    onboardingStep === 'LOCATION'
      ? 'Location'
      : onboardingStep === 'COMPLETE'
      ? 'MainTabs'
      : 'SportsInterest';

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setNavigationReady(true)}
    >
      <NotificationNavigation
        navigationRef={navigationRef}
        ready={navigationReady}
      />
      <Stack.Navigator
        key={`app-${initialRoute}`}
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'ios_from_right',
        }}
      >
        <>
          <Stack.Screen
            name="SportsInterest"
            component={SportsInterestScreen}
          />
          <Stack.Screen name="Location" component={LocationScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
          <Stack.Screen name="EventRegister" component={EventRegisterScreen} />
          <Stack.Screen name="EventTicket" component={EventTicketScreen} />
          <Stack.Screen
            name="RegistrationSummary"
            component={RegistrationSummaryScreen}
          />
          <Stack.Screen
            name="RegistrationSuccess"
            component={RegistrationSuccessScreen}
          />
          <Stack.Screen
            name="TournamentDetails"
            component={TournamentDetailsScreen}
          />
          <Stack.Screen
            name="TournamentRegister"
            component={TournamentRegisterScreen}
          />
          <Stack.Screen
            name="TournamentRegistrationSummary"
            component={TournamentRegistrationSummaryScreen}
          />
          <Stack.Screen
            name="TournamentRegistrationSuccess"
            component={TournamentRegistrationSuccessScreen}
          />
          <Stack.Screen name="VenueDetails" component={VenueDetailsScreen} />
          <Stack.Screen
            name="VenueBookingReview"
            component={VenueBookingReviewScreen}
          />
          <Stack.Screen
            name="VenueBookingSuccess"
            component={VenueBookingSuccessScreen}
          />
          <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
          <Stack.Screen
            name="BookingDetails"
            component={BookingDetailsScreen}
          />
          <Stack.Screen
            name="FullTicket"
            component={FullTicketScreen}
            options={{
              presentation: 'transparentModal',
              contentStyle: { backgroundColor: 'transparent' },
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="EventWorkspace"
            component={EventWorkspaceScreen}
          />
          <Stack.Screen name="ChatChannel" component={ChatChannelScreen} />
          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="Connections" component={ConnectionsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Support" component={SupportScreen} />
          <Stack.Screen name="PostDetails" component={PostDetailsScreen} />
        </>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const center = {
  flex: 1,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  backgroundColor: theme.colors.background,
};
const errorTitle = { ...theme.typography.h2, textAlign: 'center' as const };
const errorText = {
  ...theme.typography.body,
  textAlign: 'center' as const,
  paddingHorizontal: 28,
  marginTop: 10,
};
const retryButton = { width: 180, marginTop: 24 };
