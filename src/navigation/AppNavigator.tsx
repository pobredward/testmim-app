import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import TestDetailScreen from '../screens/TestDetailScreen';
import TestExecutionScreen from '../screens/TestExecutionScreen';
import TestResultScreen from '../screens/TestResultScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MyPageScreen from '../screens/MyPageScreen';
import GamesScreen from '../screens/GamesScreen';
import ReactionTimeGameScreen from '../screens/ReactionTimeGameScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import type { TestAnswer } from '../types/tests';

export type RootStackParamList = {
  Home: undefined;
  TestDetail: { testCode: string };
  TestExecution: { testCode: string };
  TestResult: { testCode: string; resultId: string };
  Login: undefined;
  Onboarding: undefined;
  MyPage: undefined;
  Games: undefined;
  GameDetail: { gameId: string };
  ReactionTimeGame: { gameId: string };
  Leaderboard: undefined;
  TestScreen: { testCode: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        id={undefined}
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TestDetail" component={TestDetailScreen} />
        <Stack.Screen name="TestExecution" component={TestExecutionScreen} />
        <Stack.Screen name="TestResult" component={TestResultScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MyPage" component={MyPageScreen} />
        <Stack.Screen 
          name="Games" 
          component={GamesScreen} 
          options={({ navigation }) => ({
            headerShown: true,
            title: '미니게임',
            headerStyle: {
              backgroundColor: '#3b82f6',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Leaderboard')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 4 }}>🏆</Text>
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>랭킹</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen name="GameDetail" component={GamesScreen} />
        <Stack.Screen 
          name="ReactionTimeGame" 
          component={ReactionTimeGameScreen}
          options={{
            headerShown: true,
            title: '반응속도 게임',
            headerStyle: {
              backgroundColor: '#3b82f6',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        />
        <Stack.Screen 
          name="Leaderboard" 
          component={LeaderboardScreen}
          options={{
            headerShown: true,
            title: '게임 랭킹',
            headerStyle: {
              backgroundColor: '#f59e0b',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        />
        <Stack.Screen name="TestScreen" component={TestDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 