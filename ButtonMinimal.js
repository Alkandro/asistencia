import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";

const ButtonMinimal = ({
  onPress,
  title,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    switch (variant) {
      case "secondary":
        baseStyle.push(styles.secondary);
        break;
      case "outline":
        baseStyle.push(styles.outline);
        break;
      case "danger":
        baseStyle.push(styles.danger);
        break;
      default:
        baseStyle.push(styles.primary);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabled);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];
    
    switch (variant) {
      case "secondary":
        baseStyle.push(styles.secondaryText);
        break;
      case "outline":
        baseStyle.push(styles.outlineText);
        break;
      case "danger":
        baseStyle.push(styles.dangerText);
        break;
      default:
        baseStyle.push(styles.primaryText);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabledText);
    }
    
    if (textStyle) {
      baseStyle.push(textStyle);
    }
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === "primary" || variant === "danger" ? "#FFFFFF" : "#000000"}
          style={styles.loadingIndicator}
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    // Sombra específica para iOS
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  primary: {
    backgroundColor: "#000000",
  },
  secondary: {
    backgroundColor: "#F5F5F5",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#000000",
  },
  danger: {
    backgroundColor: "#DC3545",
  },
  disabled: {
    backgroundColor: "#E0E0E0",
    borderColor: "#E0E0E0",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: "#000000",
  },
  outlineText: {
    color: "#000000",
  },
  dangerText: {
    color: "#FFFFFF",
  },
  disabledText: {
    color: "#999999",
  },
  loadingIndicator: {
    // Centrar el ActivityIndicator correctamente en iOS
    alignSelf: "center",
  },
});

export default ButtonMinimal;

