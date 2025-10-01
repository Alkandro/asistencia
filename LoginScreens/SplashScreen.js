// import React, { useEffect } from 'react';
// import { View, Image, Text, StyleSheet } from 'react-native';
// import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, interpolateColor } from 'react-native-reanimated';
// import { useTranslation } from 'react-i18next';

// const AnimatedMessage = () => {
//   const { t } = useTranslation();  // Hook para traducción
//   const opacity2 = useSharedValue(0);
//   const translateY2 = useSharedValue(30); // Controla la animación de imagen
//   const opacityText = useSharedValue(1);
//   const opacityFooter = useSharedValue(0);  
//   const translateYFooter = useSharedValue(20); 
//   const colorTransition = useSharedValue(0);

//   const animatedStyle2 = useAnimatedStyle(() => ({
//     opacity: opacity2.value,
//     transform: [{ translateY: translateY2.value }],
//   }));

//   const animatedTextStyle = useAnimatedStyle(() => ({
//     opacity: opacityText.value,
//   }));

//   const animatedFooterStyle = useAnimatedStyle(() => ({
//     opacity: opacityFooter.value,
//     transform: [{ translateY: translateYFooter.value }],
//     color: interpolateColor(
//       colorTransition.value,
//       [0, 0.33, 0.66, 1],
//       ['#ff0000', '#00ff00', '#0000ff', '#ffffff']
//     ),
//   }));

//   useEffect(() => {
//     opacity2.value = withDelay(1000, withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.ease) }));
//     translateY2.value = withDelay(1000, withTiming(10, { duration: 7000, easing: Easing.inOut(Easing.ease) }));

//     opacityText.value = withRepeat(
//       withTiming(-1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
//       -1,
//       true
//     );

//     opacityFooter.value = withDelay(8000, withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }));
//     translateYFooter.value = withDelay(8000, withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }));
    
//     colorTransition.value = withRepeat(
//       withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
//       -1,
//       false
//     );
//   }, []);

//   return (
//     <View style={styles.contentContainer}>
//       {/* <Animated.View style={[styles.textContainer, animatedTextStyle]}>
//         <Text style={styles.text}>{t("Welcome!")}</Text>
//       </Animated.View> */}
//       <Animated.View style={[styles.messageContainer1, animatedStyle2]}>
//         <Image 
//           source={require('../assets/fotos/tashiroblack.png')}
//           style={styles.image2} 
//         />
//       </Animated.View>
//       <Animated.View style={[styles.footerContainer, animatedFooterStyle]}>
//         <Text style={styles.footerText}>by Alejandro Sklar</Text>
//       </Animated.View>
//     </View>
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
//     backgroundColor: 'black',
//   },
//   contentContainer: {
//     alignItems: 'center',
//     justifyContent: 'center', // Centrar el contenido verticalmente
//     flex: 1, // Ocupar toda la pantalla
//   },
//   textContainer: {
//     marginBottom: 40, // Espacio entre el texto y la imagen
//   },
//   text: {
//     fontSize: 24,
//     color: 'white',
//     fontWeight: 'bold',
//     marginTop:-30,
//   },
//   messageContainer1: {
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   image2: {
//     width: 280,
//     height: 280,
//   },
//   footerContainer: {  
//     position: 'absolute',
//     bottom: 20,
//     alignItems: 'center',
//     marginBottom: 20,
//     paddingLeft: 150,
//   },
//   footerText: {
//     fontSize: 16,
//     color: 'white',
//     fontStyle: 'italic',
//   },
// });

// export default AppSplashScreen;
import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Animated, { 
  Easing, 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  interpolateColor 
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

const AnimatedMessage = () => {
  const { t } = useTranslation();

  const opacity2 = useSharedValue(0);
  const scale2 = useSharedValue(0.8); // arranca más pequeño
  const opacityFooter = useSharedValue(0);  
  const translateYFooter = useSharedValue(20); 
  const colorTransition = useSharedValue(0);

  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
    transform: [
      { scale: scale2.value }
    ],
  }));

  const animatedFooterStyle = useAnimatedStyle(() => ({
    opacity: opacityFooter.value,
    transform: [{ translateY: translateYFooter.value }],
    color: interpolateColor(
      colorTransition.value,
      [0, 0.33, 0.66, 1],
      ['#ff0000', '#00ff00', '#0000ff', '#ffffff']
    ),
  }));

  useEffect(() => {
    // Imagen: aparecer + crecer
    opacity2.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) });
    scale2.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) });

    // Footer más rápido
    opacityFooter.value = withDelay(1500, withTiming(1, { duration: 800 }));
    translateYFooter.value = withDelay(1500, withTiming(0, { duration: 800 }));

    // Ciclo de color
    colorTransition.value = withTiming(1, { duration: 4000, easing: Easing.linear });
  }, []);

  return (
    <View style={styles.contentContainer}>
      <Animated.View style={[styles.messageContainer1, animatedStyle2]}>
        <Image 
          source={require('../assets/fotos/tashiroblack.png')}
          style={styles.image2} 
        />
      </Animated.View>
      <Animated.View style={[styles.footerContainer, animatedFooterStyle]}>
        <Text style={styles.footerText}>by Alejandro Sklar</Text>
      </Animated.View>
    </View>
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
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  messageContainer1: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image2: {
    width: 280,
    height: 280,
  },
  footerContainer: {  
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: 'white',
    fontStyle: 'italic',
  },
});

export default AppSplashScreen;
