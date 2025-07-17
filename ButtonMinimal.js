import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const ButtonMinimal = ({ onPress, title, style, textStyle, disabled = false, variant = 'primary' }) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.buttonSecondary, disabled && styles.buttonDisabled];
      case 'outline':
        return [styles.buttonOutline, disabled && styles.buttonDisabled];
      case 'danger':
        return [styles.buttonDanger, disabled && styles.buttonDisabled];
      default:
        return [styles.buttonPrimary, disabled && styles.buttonDisabled];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.textSecondary;
      case 'outline':
        return styles.textOutline;
      case 'danger':
        return styles.textDanger;
      default:
        return styles.textPrimary;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={disabled ? null : onPress}
      activeOpacity={disabled ? 1 : 0.8}
    >
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Botón primario - Negro con texto blanco
  buttonPrimary: {
    backgroundColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  textPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Botón secundario - Gris con texto negro
  buttonSecondary: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  textSecondary: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },

  // Botón outline - Transparente con borde negro
  buttonOutline: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  textOutline: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },

  // Botón de peligro - Rojo para logout
  buttonDanger: {
    backgroundColor: '#DC3545',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  textDanger: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Estado deshabilitado
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default ButtonMinimal;
