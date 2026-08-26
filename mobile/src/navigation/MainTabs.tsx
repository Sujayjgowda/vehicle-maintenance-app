import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors, fontSize } from '../theme/colors';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import VehicleListScreen from '../screens/vehicles/VehicleListScreen';
import VehicleDetailScreen from '../screens/vehicles/VehicleDetailScreen';
import AddVehicleScreen from '../screens/vehicles/AddVehicleScreen';
import FuelListScreen from '../screens/fuel/FuelListScreen';
import AddFuelScreen from '../screens/fuel/AddFuelScreen';
import ServiceListScreen from '../screens/service/ServiceListScreen';
import AddServiceScreen from '../screens/service/AddServiceScreen';
import ExpenseListScreen from '../screens/expenses/ExpenseListScreen';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';
import ReminderListScreen from '../screens/reminders/ReminderListScreen';
import AddReminderScreen from '../screens/reminders/AddReminderScreen';
import PartListScreen from '../screens/parts/PartListScreen';
import AddPartScreen from '../screens/parts/AddPartScreen';
import RepairListScreen from '../screens/repairs/RepairListScreen';
import AddRepairScreen from '../screens/repairs/AddRepairScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const VehicleStack = createNativeStackNavigator();
const ReminderStack = createNativeStackNavigator();

function VehiclesStackNavigator() {
  return (
    <VehicleStack.Navigator screenOptions={{ headerShown: false }}>
      <VehicleStack.Screen name="VehicleList" component={VehicleListScreen} />
      <VehicleStack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <VehicleStack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ headerShown: true, title: 'Add Vehicle', headerTintColor: colors.primary }} />
      <VehicleStack.Screen name="FuelList" component={FuelListScreen} />
      <VehicleStack.Screen name="AddFuel" component={AddFuelScreen} options={{ headerShown: true, title: 'Add Fuel Record', headerTintColor: colors.primary }} />
      <VehicleStack.Screen name="ServiceList" component={ServiceListScreen} />
      <VehicleStack.Screen name="AddService" component={AddServiceScreen} options={{ headerShown: true, title: 'Add Service', headerTintColor: colors.primary }} />
      <VehicleStack.Screen name="ExpenseList" component={ExpenseListScreen} />
      <VehicleStack.Screen name="AddExpense" component={AddExpenseScreen} options={{ headerShown: true, title: 'Add Expense', headerTintColor: colors.primary }} />
      <VehicleStack.Screen name="ReminderList" component={ReminderListScreen} />
      <VehicleStack.Screen name="AddReminder" component={AddReminderScreen} options={{ headerShown: true, title: 'Set Reminder', headerTintColor: colors.primary }} />
      <VehicleStack.Screen name="PartList" component={PartListScreen} />
      <VehicleStack.Screen name="AddPart" component={AddPartScreen} options={{ headerShown: true, title: 'Add Part', headerTintColor: colors.primary }} />
      <VehicleStack.Screen name="RepairList" component={RepairListScreen} />
      <VehicleStack.Screen name="AddRepair" component={AddRepairScreen} options={{ headerShown: true, title: 'Add Repair', headerTintColor: colors.primary }} />
    </VehicleStack.Navigator>
  );
}

function RemindersStackNavigator() {
  return (
    <ReminderStack.Navigator screenOptions={{ headerShown: false }}>
      <ReminderStack.Screen name="ReminderOverview" component={ReminderListScreen} />
      <ReminderStack.Screen name="AddReminder" component={AddReminderScreen} options={{ headerShown: true, title: 'Set Reminder', headerTintColor: colors.primary }} />
    </ReminderStack.Navigator>
  );
}

// Custom glassmorphism tab bar background
function GlassTabBarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView
        intensity={40}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View style={tabBarBgStyles.overlay} />
    </View>
  );
}

const tabBarBgStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.glassBg,
  },
});


export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => {
          let iconName: any;
          if (route.name === 'DashboardTab') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'VehiclesTab') {
            iconName = focused ? 'bicycle' : 'bicycle-outline';
          } else if (route.name === 'RemindersTab') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View style={focused ? glowStyles.glowWrap : glowStyles.noGlow}>
              {focused && <View style={glowStyles.glowHalo} />}
              <Ionicons name={iconName} size={size} color={focused ? colors.glassGlow : '#64748B'} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.glassGlow,
        tabBarInactiveTintColor: '#64748B',
        tabBarBackground: () => <GlassTabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.glassBorder,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '600',
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="VehiclesTab" component={VehiclesStackNavigator} options={{ tabBarLabel: 'Vehicles' }} />
      <Tab.Screen name="RemindersTab" component={RemindersStackNavigator} options={{ tabBarLabel: 'Reminders' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

const glowStyles = StyleSheet.create({
  glowWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    position: 'relative',
  },
  noGlow: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  glowHalo: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassGlow,
    opacity: 0.2,
  },
});
