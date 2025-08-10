import AppHeader from '@/components/AppHeader';
import React from 'react';
import { View, Text } from 'react-native';

export default function PaymentScreen() {
  return (
    <View>
      {/* Header */}
      <AppHeader/>
      <Text>PaymentScreen Page</Text>
    </View>
  );
}