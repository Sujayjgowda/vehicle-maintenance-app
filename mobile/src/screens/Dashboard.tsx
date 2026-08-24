import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

const mockData = {
  odometer: '45,230',
  avgMileage: '14.5',
  fuelCostPerKm: '₹ 6.50',
  totalFuelExpense: '₹ 15,400',
  totalMaintenanceExpense: '₹ 8,200',
  nextServiceDate: '2026-10-15',
  nextServiceKm: '50,000',
  insuranceExpiry: '2027-01-10',
  pucExpiry: '2026-12-05',
  batteryHealth: 'Good',
  tireReplacementDue: '60,000 KM'
};

const MetricCard = ({ title, value, highlight }: { title: string, value: string, highlight?: boolean }) => (
  <View style={[styles.card, highlight && styles.highlightCard]}>
    <Text style={[styles.cardTitle, highlight && styles.highlightText]}>{title}</Text>
    <Text style={[styles.cardValue, highlight && styles.highlightText]}>{value}</Text>
  </View>
);

export default function Dashboard() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Vehicle Dashboard</Text>
        
        <View style={styles.grid}>
          <MetricCard title="Odometer (KM)" value={mockData.odometer} highlight />
          <MetricCard title="Avg Mileage (KM/L)" value={mockData.avgMileage} />
          
          <MetricCard title="Fuel Cost / KM" value={mockData.fuelCostPerKm} />
          <MetricCard title="Total Fuel Exp" value={mockData.totalFuelExpense} />
          
          <MetricCard title="Maint. Expense" value={mockData.totalMaintenanceExpense} />
          <MetricCard title="Next Service Date" value={mockData.nextServiceDate} highlight />
          
          <MetricCard title="Next Service KM" value={mockData.nextServiceKm} />
          <MetricCard title="Insurance Expiry" value={mockData.insuranceExpiry} />
          
          <MetricCard title="PUC Expiry" value={mockData.pucExpiry} />
          <MetricCard title="Battery Health" value={mockData.batteryHealth} />
          
          <MetricCard title="Tire Replacement" value={mockData.tireReplacementDue} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    padding: 16,
    paddingTop: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  highlightCard: {
    backgroundColor: '#4A90E2',
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  highlightText: {
    color: '#FFF',
  },
});
