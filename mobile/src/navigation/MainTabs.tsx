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
import PartListScreen from '../screens/parts/PartListScreen';
import AddPartScreen from '../screens/parts/AddPartScreen';
import RepairListScreen from '../screens/repairs/RepairListScreen';
import AddRepairScreen from '../screens/repairs/AddRepairScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const VehicleStack = createNativeStackNavigator();
const ExpenseStack = createNativeStackNavigator();

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
      <VehicleStack.Screen name="PartList" component={PartListScreen} />
      <VehicleStack.Screen name="AddPart" component={AddPartScreen} options={{ headerShown: true, title: 'Add Part', headerTintColor: colors.primary }} />
      <VehicleStack.Screen name="RepairList" component={RepairListScreen} />
      <VehicleStack.Screen name="AddRepair" component={AddRepairScreen} options={{ headerShown: true, title: 'Add Repair', headerTintColor: colors.primary }} />
    </VehicleStack.Navigator>
  );
}

function ExpensesStackNavigator() {
  return (
    <ExpenseStack.Navigator screenOptions={{ headerShown: false }}>
      <ExpenseStack.Screen name="ExpenseOverview" component={ExpenseListScreen} initialParams={{}} />
    </ExpenseStack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'DashboardTab') iconName = 'home';
          else if (route.name === 'VehiclesTab') iconName = 'car-sport';
          else if (route.name === 'RemindersTab') iconName = 'notifications';
          else if (route.name === 'ProfileTab') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="VehiclesTab" component={VehiclesStackNavigator} options={{ tabBarLabel: 'Vehicles' }} />
      <Tab.Screen name="RemindersTab" component={ReminderListScreen} options={{ tabBarLabel: 'Reminders' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
