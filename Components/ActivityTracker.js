// ActivityTracker.js - Hook para rastrear actividad del usuario automáticamente
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// 🆕 HOOK PERSONALIZADO PARA RASTREAR ACTIVIDAD
export const useActivityTracker = () => {
  const appState = useRef(AppState.currentState);
  const lastUpdateRef = useRef(null);
  const intervalRef = useRef(null);

  // Función para actualizar la actividad del usuario
  const updateUserActivity = async (force = false) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('👤 No hay usuario autenticado');
        return;
      }

      const now = Date.now();
      
      // Evitar actualizaciones muy frecuentes (mínimo cada 2 minutos)
      if (!force && lastUpdateRef.current && (now - lastUpdateRef.current) < 2 * 60 * 1000) {
        console.log('⏱️ Actividad actualizada recientemente, saltando...');
        return;
      }

      console.log('🔄 Actualizando lastActivity para usuario:', user.uid);
      
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          lastActivity: new Date(),
        });
        
        lastUpdateRef.current = now;
        console.log('✅ lastActivity actualizado exitosamente');
      } else {
        console.warn('⚠️ Documento de usuario no encontrado:', user.uid);
      }
    } catch (error) {
      console.error('❌ Error actualizando lastActivity:', error);
    }
  };

  // Configurar rastreador automático
  useEffect(() => {
    console.log('🚀 Iniciando ActivityTracker...');

    // Actualizar actividad inmediatamente al montar
    updateUserActivity(true);

    // Configurar intervalo para actualizar cada 3 minutos
    intervalRef.current = setInterval(() => {
      if (appState.current === 'active') {
        updateUserActivity();
      }
    }, 3 * 60 * 1000); // 3 minutos

    // Listener para cambios de estado de la app
    const handleAppStateChange = (nextAppState) => {
      console.log('📱 Estado de app cambió:', appState.current, '→', nextAppState);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🔄 App volvió a primer plano, actualizando actividad...');
        updateUserActivity(true);
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      console.log('🛑 Limpiando ActivityTracker...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription?.remove();
    };
  }, []);

  // Función manual para forzar actualización
  const forceUpdate = () => {
    console.log('🔄 Forzando actualización de actividad...');
    updateUserActivity(true);
  };

  return { forceUpdate };
};

// 🆕 COMPONENTE WRAPPER PARA USAR EN APP.JS
export const ActivityTrackerProvider = ({ children }) => {
  useActivityTracker();
  return children;
};

// 🆕 FUNCIÓN UTILITARIA PARA USAR EN ACCIONES ESPECÍFICAS
export const trackUserActivity = async (action = 'general') => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    console.log(`🎯 Rastreando actividad: ${action} para usuario:`, user.uid);
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        lastActivity: new Date(),
        [`lastAction_${action}`]: new Date(), // Opcional: rastrear acciones específicas
      });
      
      console.log(`✅ Actividad rastreada: ${action}`);
    }
  } catch (error) {
    console.error(`❌ Error rastreando actividad (${action}):`, error);
  }
};

export default useActivityTracker;
