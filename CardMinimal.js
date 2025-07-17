import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

const CardMinimal = ({ 
  children, 
  style, 
  onPress, 
  shadow = true, 
  padding = true,
  ...props 
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.card,
        shadow && styles.cardShadow,
        padding && styles.cardPadding,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.95 : 1}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginVertical: 4,
  },
  cardShadow: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardPadding: {
    padding: 16,
  },
});

export default CardMinimal;
