import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import TestDetailScreen from '../screens/TestDetailScreen';
import TestExecutionScreen from '../screens/TestExecutionScreen';
import TestResultScreen from '../screens/TestResultScreen';
import LoginScreen from '../screens/LoginScreen';
import type { TestAnswer } from '../types/tests';

export type RootStackParamList = {
  Home: undefined;
  TestDetail: { testCode: string };
  TestExecution: { testCode: string };
  TestResult: { testCode: string; answers: TestAnswer[] };
  Login: undefined;
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
      </Stack.Navigator>
    </NavigationContainer>
  );
} 