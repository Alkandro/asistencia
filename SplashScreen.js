import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, interpolateColor } from 'react-native-reanimated';

const AnimatedMessage = () => {
  const opacity = useSharedValue(0);  
  const translateY = useSharedValue(50);  

  const opacity2 = useSharedValue(0);
  const translateY2 = useSharedValue(50);

  const opacityText = useSharedValue(1);
  const opacityFooter = useSharedValue(0);  
  const translateYFooter = useSharedValue(20); 
  
   // Valor compartido para animar el color de "by Alejandro Sklar"
   const colorTransition = useSharedValue(0);

  const animatedStyles = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
    transform: [{ translateY: translateY2.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: opacityText.value,
  }));

  // Estilos animados para el mensaje "by Alejandro Sklar"
  const animatedFooterStyle = useAnimatedStyle(() => ({
    opacity: opacityFooter.value,
    transform: [{ translateY: translateYFooter.value }],
    color: interpolateColor(
      colorTransition.value,
      [0, 0.33, 0.66, 1],
      ['#ff0000', '#00ff00', '#0000ff', '#ffffff'] // Colores: rojo, verde, azul, blanco
    ),
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) });
    translateY.value = withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.ease) });

    opacity2.value = withDelay(1000, withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }));
    translateY2.value = withDelay(1000, withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.ease) }));

        // Animación de parpadeo para el texto
    opacityText.value = withRepeat(
       withTiming(-1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
       -1,  // -1 indica que se repite indefinidamente
       true  // alterna entre opacidad 1 y 0
     );

    // Animación de entrada para el mensaje "by Alejandro Sklar"
    opacityFooter.value = withDelay(9000, withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }));
    translateYFooter.value = withDelay(9000, withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }));
    // Transición de colores hasta blanco para el mensaje de pie de página
    colorTransition.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );

  }, []);

  return (
    <View style={styles.contentContainer}>
      <Animated.View style={[styles.textContainer, animatedTextStyle]}>
        <Text style={styles.text}>Welcome!</Text>
      </Animated.View>
      <Animated.View style={[styles.messageContainer, animatedStyles]}>
        <Image 
          source={require('./assets/fotos/overLimit.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View style={[styles.messageContainer1, animatedStyle2]}>
        <Image 
          source={require('./assets/fotos/TashiroBlack.jpg')}
          style={styles.image2} 
        />
      </Animated.View>
      {/* Nuevo mensaje animado de pie de página */}
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
    marginTop: -90,
  },
  messageContainer: {
    margin: 5,
  },
  messageContainer1: {
    margin: -10,
  },
  image: {
    width: 200,
    height: 200,
  },
  image2: {
    width: 150,
    height: 150,
    marginTop: -40,
  },
  text: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  textContainer: {
    marginTop: 10,
  },
  footerContainer: {  
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
    margin:-250,
    paddingLeft:150,
  },
  footerText: {
    fontSize: 16,
    color: 'white',
    fontStyle: 'italic',
  },
});

export default AppSplashScreen;
