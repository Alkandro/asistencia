// MessageForm.js
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
// Ajusta la importación según tu fuente de íconos preferida de FontAwesome 6:
import Icon from "react-native-vector-icons/FontAwesome5";

const MessageForm = React.forwardRef(({
  message,
  setMessage,
  additionalField1,
  setAdditionalField1,
  additionalField2,
  setAdditionalField2,
  additionalField3,
  setAdditionalField3,
  localImageUri,
  setLocalImageUri,
  uploading,
  handleChooseImage,
  handleSaveMessage,
  editingMessage,
  handleCancelEdit,
}, ref) => {
  return (
    <View style={styles.formContainer}>
      <Text style={styles.label}>
        {editingMessage ? "Editar Mensaje:" : "Escribe un mensaje:"}
      </Text>
      <TextInput
        ref={ref}
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Mensaje..."
        multiline
        numberOfLines={4}
        autoCorrect={false}
        autoCapitalize="none"
      />

      <Text style={styles.label}>🇯🇵</Text>
      <TextInput
        style={styles.input}
        value={additionalField1}
        onChangeText={setAdditionalField1}
        placeholder="Mensaje..."
      />

      <Text style={styles.label}>🇺🇸</Text>
      <TextInput
        style={styles.input}
        value={additionalField2}
        onChangeText={setAdditionalField2}
        placeholder="Mensaje..."
      />

      <Text style={styles.label}>🇪🇸</Text>
      <TextInput
        style={styles.input}
        value={additionalField3}
        onChangeText={setAdditionalField3}
        placeholder="Mensaje..."
      />

      {/* FILA DE ÍCONOS ARRIBA DE LA IMAGEN */}
      <View style={styles.iconRow}>
        {/* Ícono para ELEGIR imagen */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleChooseImage}
        >
          <Icon name="image" size={24} color="#000" />
        </TouchableOpacity>

        {/* Ícono para ELIMINAR imagen (si quieres deshabilitarlo cuando no hay imagen, puedes poner lógica) */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setLocalImageUri(null)}
        >
          <Icon name="trash" size={24} color="#ff4d4d" />
        </TouchableOpacity>

        {/* Ícono para SUBIR/ACTUALIZAR mensaje */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleSaveMessage}
        >
          <Icon
            name="paper-plane"
            size={24}
            color="#007bff"
          />
        </TouchableOpacity>
      </View>

      {/* PREVISUALIZACIÓN DE LA IMAGEN */}
      {localImageUri && (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: localImageUri }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
        </View>
      )}

      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.uploadingText}>Subiendo imagen...</Text>
        </View>
      )}

      {/* Botón solo visible si estás editando un mensaje (opcional) */}
      {editingMessage && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelEdit}
        >
          <Text style={styles.cancelButtonText}>Cancelar Edición</Text>
        </TouchableOpacity>
      )}

      <View style={styles.separator} />
    </View>
  );
});

const styles = StyleSheet.create({
  formContainer: {
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between", // Reparte espacio en la fila
    alignItems: "center",
    marginBottom: 10,
  },
  iconButton: {
    padding: 10,
  },
  imagePreviewContainer: {
    marginBottom: 10,
    alignItems: "center",
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  uploadingContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  uploadingText: {
    marginTop: 5,
    fontSize: 16,
    color: "#555",
  },
  cancelButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 20,
  },
});

export default React.memo(MessageForm);
