import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export const StyledInput = ({ label, ...props }) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} {...props} placeholderTextColor="#A0AEC0" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_600SemiBold', // Asegúrate de tener esta fuente cargada
    fontSize: 16,
    color: '#1A202C', // Texto Principal
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5', // Fondo sutil
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular', // Asegúrate de tener esta fuente cargada
    color: '#1A202C', // Color de texto para el input
  },
});