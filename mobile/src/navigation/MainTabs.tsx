import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
import AiMechanicScreen from '../screens/ai/AiMechanicScreen';
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
      <VehicleStack.Screen name="AiMechanic" component={AiMechanicScreen} />
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

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'DashboardTab') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'VehiclesTab') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'RemindersTab') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="VehiclesTab" component={VehiclesStackNavigator} options={{ tabBarLabel: 'My Fleet' }} />
      <Tab.Screen name="RemindersTab" component={RemindersStackNavigator} options={{ tabBarLabel: 'Reminders' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
