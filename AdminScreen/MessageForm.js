// components/MessageForm.js
import React from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

// Usamos forwardRef para permitir que el padre controle el enfoque
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
        numberOfLines={20}
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

      <Button title="Elegir Imagen" onPress={handleChooseImage} />

      {localImageUri && (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: localImageUri }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setLocalImageUri(null)}
          >
            <Text style={styles.removeImageText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}

      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.uploadingText}>Subiendo imagen...</Text>
        </View>
      )}

      <Button
        title={editingMessage ? "Actualizar Mensaje" : "Subir Mensaje"}
        onPress={handleSaveMessage}
      />

      {editingMessage && (
        <Button
          title="Cancelar Edición"
          color="red"
          onPress={handleCancelEdit}
        />
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
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  imagePreviewContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  removeImageButton: {
    marginTop: 5,
    backgroundColor: "#ff4d4d",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  removeImageText: {
    color: "#fff",
    fontWeight: "bold",
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
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 20,
  },
});

export default React.memo(MessageForm);
