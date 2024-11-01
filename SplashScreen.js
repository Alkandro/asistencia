// import React, { useEffect } from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

// const AnimatedMessage = () => {
//   const opacity = useSharedValue(0);   // Inicia invisible
//   const translateY = useSharedValue(50);  // Inicia más abajo en Y
//   const scale = useSharedValue(0.8);   // Inicia con un tamaño más pequeño (80%)
//   // const rotation = useSharedValue(0); // Inicia sin rotación

//   // Estilos animados
//   const animatedStyles = useAnimatedStyle(() => {
//     return {
//       opacity: opacity.value,
//       transform: [
//         { translateY: translateY.value },
//         { scale: scale.value },  // Aplicamos la escala
//         // { rotateZ: `${rotation.value}deg` },// Aplicamos rotación en grados
//       ],
//     };
//   });

//   useEffect(() => {
//     // Lanzar las animaciones de opacidad, translación y escala
//     opacity.value = withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) });  // Aparece gradualmente
//     translateY.value = withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) });  // Se mueve a su posición
//     scale.value = withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) });  // Aumenta el tamaño a 100%
//     // rotation.value = withTiming(360, { duration: 2000, easing: Easing.inOut(Easing.ease) });  // Rota 360 grados

//     // Ocultar splash screen después de 3 segundos si es necesario
//     setTimeout(() => {
//       // Aquí puedes esconder el splash screen si usas uno nativo
//     }, 3000);
//   }, []);

//   return (
//     <Animated.View style={[styles.messageContainer, animatedStyles]}>
//       <Text style={styles.message}>株式会社 新井商運</Text>
//     </Animated.View>
//   );
// };

// const AppSplashScreen = () => {
//   return (
//     <View style={styles.container}>
//       <AnimatedMessage />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'black',  // Color de fondo del splash
//   },
//   messageContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   message: {
//     fontSize: 24,
//     color: 'white',
//     fontWeight: 'bold',
//   },
// });

// export default AppSplashScreen;

import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const AnimatedMessage = () => {
  const opacity = useSharedValue(0);  
  const translateY = useSharedValue(50);  
  const scale = useSharedValue(0.8);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },  
      ],
    };
  });

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) });
    translateY.value = withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) });
    scale.value = withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) });
  }, []);

  return (
    <Animated.View style={[styles.messageContainer, animatedStyles]}>
      <Image 
        source={require('./assets/fotos/TashiroBlack.jpg')}  // Asegúrate de ajustar la ruta a tu imagen
        style={styles.image}  // Aplica estilos personalizados a la imagen
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const AppSplashScreen = () => {
  return (
    <View style={styles.container}>
      <AnimatedMessage />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  messageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,  // Ajusta el tamaño de la imagen según tu diseño
    height: 200,
  },
});

export default AppSplashScreen;
