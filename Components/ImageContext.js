// ImageContext.js
import React, { createContext, useState, useContext } from "react";

// Crear el contexto
const ImageContext = createContext();

// Crear el proveedor
export const ImageProvider = ({ children }) => {
  const [imageUri, setImageUri] = useState(null);

  return (
    <ImageContext.Provider value={{ imageUri, setImageUri }}>
      {children}
    </ImageContext.Provider>
  );
};

// Crear un hook para usar el contexto fácilmente
export const useImageContext = () => useContext(ImageContext);
