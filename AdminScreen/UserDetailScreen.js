import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Keyboard, 
  TouchableWithoutFeedback, 
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";

import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/es";
import "dayjs/locale/ja";
import "dayjs/locale/en";
import "dayjs/locale/pt";

import StarRating from "react-native-star-rating-widget";
import { SwipeListView } from "react-native-swipe-list-view";
import { ScrollView } from "react-native-gesture-handler";

// dayjs config
dayjs.extend(localeData);
dayjs.locale("es");
dayjs.locale("ja");
dayjs.locale("en");
dayjs.locale("pt");
// Puedes comentar o dejar dayjs.locale(...) si no necesitas forzar un idioma global

// ----------------------------------
// FUNCIONES AUXILIARES
// ----------------------------------
function calculateDanInfo(beltColor, totalCheckIns) {
  const color = beltColor?.toLowerCase() || "white";
  const groupSize = color === "white" ? 40 : 60;
  const maxDan = 4;

  const rawGroup = Math.floor(totalCheckIns / groupSize);
  let currentDan = rawGroup + 1;
  if (currentDan > maxDan) currentDan = maxDan;

  let countInGroup = totalCheckIns % groupSize;
  if (countInGroup === 0 && totalCheckIns > 0) {
    countInGroup = groupSize;
  }

  return { rawGroup, currentDan, groupSize, countInGroup };
}

async function checkDansCompletion(userData, getDanLabel) {
  if (!userData?.cinturon) return;
  const currentBelt = userData.cinturon.toLowerCase();

  // Si existe un lastCinturon y es distinto al cinturón actual, reinicia los dans completados
  if (userData.lastCinturon && userData.lastCinturon !== currentBelt) {
    await updateDoc(doc(db, "users", userData.uid), {
      danCompletes: [],
      lastCinturon: currentBelt,
    });
    userData.danCompletes = [];
  } else if (!userData.lastCinturon) {
    // Si no existe, lo establecemos con el cinturón actual
    await updateDoc(doc(db, "users", userData.uid), { lastCinturon: currentBelt });
  }

  const total = userData.allTimeCheckIns || 0;
  let danCompletes = userData.danCompletes || [];
  const { rawGroup, groupSize } = calculateDanInfo(userData.cinturon, total);

  if (rawGroup >= 1 && rawGroup <= 4) {
    const found = danCompletes.find((obj) => obj.dan === rawGroup);
    if (!found) {
      danCompletes.push({
        dan: rawGroup,
        groupSize,
        count: groupSize,
        completedOn: new Date(),
      });
      await updateDoc(doc(db, "users", userData.uid), { danCompletes });
      Alert.alert(
        "¡Dan Completado!",
        `${getDanLabel(rawGroup)} completado (${groupSize}/${groupSize}) ✓.`
      );
    }
  }
}


// ----------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------
export default function UserDetailScreen() {
  const route = useRoute();
  const { userId } = route.params;
  const { t } = useTranslation();

  // Estados
  const [userData, setUserData] = useState(null);
  const [monthlyCheckInCount, setMonthlyCheckInCount] = useState({});
  const [ratings, setRatings] = useState([]);
  const [score, setScore] = useState(0);
  const [averageRating, setAverageRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Expandir/cerrar detalles
  const [userDetailExpanded, setUserDetailExpanded] = useState(false);
  const [ratingsHistoryExpanded, setRatingsHistoryExpanded] = useState(false);

  // Expandir por año
  const [expandedYear, setExpandedYear] = useState(null);

  // ESTADO para la edición manual de entrenamientos
  const [manualCheckIns, setManualCheckIns] = useState("");

  function getDanLabel(danNumber) {
    switch (danNumber) {
      case 1:
        return t("Primer Dan");
      case 2:
        return t("Segundo Dan");
      case 3:
        return t("Tercer Dan");
      case 4:
        return t("Cuarto Dan");
      default:
        return "";
    }
  }

  // Efectos
  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserData(),
      fetchMonthlyCheckInCount(),
      fetchRatings(),
    ]);
    setLoading(false);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [userId]);

  // ----------------------------------
  // OBTENER DATOS DEL USUARIO
  // ----------------------------------
  const fetchUserData = async () => {
    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setUserData({ uid: userId, ...data });

        // Chequear Dan completado
        await checkDansCompletion({ uid: userId, ...data }, getDanLabel);

        // Al cargar, si existe allTimeCheckIns, ponerlo en manualCheckIns
        if (data.allTimeCheckIns != null) {
          setManualCheckIns(String(data.allTimeCheckIns));
        }
      } else {
        Alert.alert("Error", "El usuario no existe.");
      }
    } catch (error) {
      console.error("Error al obtener datos usuario:", error);
      Alert.alert("Error", "No se pudo obtener los datos del usuario.");
    }
  };

  // ----------------------------------
  // GUARDAR EDICIÓN MANUAL DE ENTRENAMIENTOS
  // ----------------------------------
  const handleSaveManual = async () => {
    if (!userData) return;
    const newVal = parseInt(manualCheckIns, 10);
    if (isNaN(newVal)) {
      Alert.alert("Error", "Por favor ingresa un número válido");
      return;
    }
    try {
      const userDocRef = doc(db, "users", userData.uid);
      await updateDoc(userDocRef, {
        allTimeCheckIns: newVal,
      });
      Alert.alert("Éxito", `Entrenamientos ajustados a ${newVal}`);
      await loadData();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo actualizar");
    }
  };

  // ----------------------------------
  // OBTENER HISTORIAL CHECK-INS
  // ----------------------------------
  const fetchMonthlyCheckInCount = useCallback(async () => {
    try {
      const ref = collection(db, "attendanceHistory");
      const qy = query(ref, where("userId", "==", userId));
      const qs = await getDocs(qy);

      const obj = {};
      qs.forEach((docSnap) => {
        const d = docSnap.data();
        const ts = d.timestamp?.seconds
          ? new Date(d.timestamp.seconds * 1000)
          : null;
        if (ts) {
          const mk = dayjs(ts).format("YYYY-MM-01");
          obj[mk] = (obj[mk] || 0) + 1;
        }
      });
      setMonthlyCheckInCount(obj);
    } catch (e) {
      console.error("Error historial:", e);
      Alert.alert("Error", "No se pudo obtener el historial.");
    }
  }, [userId]);

  // ----------------------------------
  // OBTENER LISTA DE PUNTUACIONES
  // ----------------------------------
  const fetchRatings = useCallback(async () => {
    try {
      const ref = collection(db, "users", userId, "ratings");
      const qy = query(ref, orderBy("createdAt", "desc"));
      const unsub = onSnapshot(qy, (snap) => {
        const arr = [];
        snap.forEach((dd) => arr.push({ id: dd.id, ...dd.data() }));
        setRatings(arr);

        if (arr.length > 0) {
          const total = arr.reduce((acc, c) => acc + c.score, 0);
          const avg = (total / arr.length).toFixed(1);
          setAverageRating(avg);
          setScore(arr[0].score); // la última puntuación
        } else {
          setAverageRating(null);
        }
      });
      return () => unsub();
    } catch (error) {
      console.error("Error puntuaciones:", error);
    }
  }, [userId]);

  // ----------------------------------
  // ENVIAR PUNTUACIÓN
  // ----------------------------------
  const handleSubmitRating = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "Debes iniciar sesión para puntuar.");
        return;
      }
      const ratingsRef = collection(db, "users", userId, "ratings");
      await addDoc(ratingsRef, {
        score,
        createdAt: serverTimestamp(),
        ratedBy: currentUser.uid,
      });
      Alert.alert("Exito", "Puntuación enviada.");
    } catch (error) {
      console.error("Error enviando puntuación:", error);
      Alert.alert("Error", "No se pudo enviar la puntuación.");
    }
  };

  // ----------------------------------
  // ELIMINAR PUNTUACIÓN (swipe)
  // ----------------------------------
  const handleDeleteRating = async (ratingId) => {
    try {
      await deleteDoc(doc(db, "users", userId, "ratings", ratingId));
    } catch (err) {
      console.error("Error al eliminar puntuación:", err);
      Alert.alert("Error", "No se pudo eliminar la puntuación.");
    }
  };

  // ----------------------------------
  // SWIPE LIST
  // ----------------------------------
  const renderFrontItem = ({ item }) => {
    return (
      <View style={styles.rowFront}>
        <Text style={styles.ratingScore}>⭐ {item.score}/10</Text>
        <Text style={styles.ratingDate}>
          {item.createdAt
            ? dayjs(item.createdAt.toDate()).format("DD/MM/YYYY HH:mm")
            : "Sin fecha"}
        </Text>
      </View>
    );
  };

  const renderHiddenItem = ({ item }, rowMap) => {
    return (
      <View style={styles.rowBack}>
        <TouchableOpacity
          style={styles.backRightBtn}
          onPress={() => {
            if (rowMap[item.id]) rowMap[item.id].closeRow();
            handleDeleteRating(item.id);
          }}
        >
          <Text style={styles.backTextWhite}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleSwipeValueChange = (swipeData) => {
    const { key, value, direction } = swipeData;
    if (direction === "left" && value > 100) {
      handleDeleteRating(key);
    }
  };

  // ----------------------------------
  // LOADING / VALIDACIÓN
  // ----------------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  if (!userData) {
    return (
      <View style={styles.center}>
        <Text>No se encontraron datos del usuario.</Text>
      </View>
    );
  }

  // ----------------------------------
  // CALCULAR DAN ACTUAL
  // ----------------------------------
  const allTime = userData.allTimeCheckIns || 0;
  const { rawGroup, currentDan, groupSize, countInGroup } = calculateDanInfo(
    userData.cinturon,
    allTime
  );
  const danLabel = getDanLabel(currentDan);

  // ----------------------------------
  // DAN COMPLETADOS DE ESTE CINTURÓN
  // ----------------------------------
  const danCompletes = (userData.danCompletes || []).filter(dc => dc.groupSize === groupSize);
  danCompletes.sort((a, b) => a.dan - b.dan);
  const danCompletionUI = danCompletes.map((dc) => (
    <Text key={dc.dan} style={styles.danItem}>
      {getDanLabel(dc.dan)} completado ({dc.count}/{dc.groupSize}) ✓
    </Text>
  ));

  // Agrupar Check-Ins por año (para el ListFooter)
  const groupedByYear = Object.keys(monthlyCheckInCount).reduce((acc, mk) => {
    const yr = dayjs(mk).year();
    if (!acc[yr]) acc[yr] = [];
    acc[yr].push({ month: mk, count: monthlyCheckInCount[mk] });
    return acc;
  }, {});

  const toggleYear = (year) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  // 1. Función para capitalizar
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 2. Objeto para mapear el nombre del cinturón a un color
const beltColors = {
  blue: "blue",
  purple: "#AA60C8",
  brown: "#8B4513", // por ejemplo
  black: "black",
};


  // ----------------------------------
  // RENDER PRINCIPAL
  // ----------------------------------
  return (
    
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
    <View style={{ flex: 1 }}>
      {/* 
        1) MOVEMOS TODA LA “CABECERA” FUERA DE LA LISTA
           Incluyendo TextInput y detalles del usuario
      */}
      <View style={{ paddingHorizontal: 10, backgroundColor: "#f8f8f8" }}>
        {/* Detalle del Usuario (desplegable) */}
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setUserDetailExpanded(!userDetailExpanded)}
        >
          <Text style={styles.dropdownHeaderText}>
            {t("Detalle del Usuario")}
          </Text>
          <Icon
            name={userDetailExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#333"
          />
        </TouchableOpacity>

        {/* Contenido expandible */}
        {userDetailExpanded && (
          <View style={styles.dropdownContent}>
            <Text style={styles.text}>
              {t("Usuario")}: {userData.username || "--"}
            </Text>
            <Text style={styles.text}>
              {t("Nombre")}: {userData.nombre || "--"}
            </Text>
            <Text style={styles.text}>
              {t("Apellido")}: {userData.apellido || "--"}
            </Text>
            <Text style={styles.text}>
              {t("Correo electonico")}: {userData.email || "--"}
            </Text>
            <Text style={styles.text}>
              {t("Teléfono")}: {userData.phone || "--"}
            </Text>
            <Text style={styles.text}>
              {t("Ciudad")}: {userData.ciudad || "--"}
            </Text>
            <Text style={styles.text}>
              {t("Provincia")}: {userData.provincia || "--"}
            </Text>
            <Text style={styles.text}>
              {t("Peso")}: {userData.peso || "--"}
            </Text>
            <Text style={styles.text}>
              {t("Altura")}: {userData.altura || "--"}
            </Text>
            <Text style={styles.text}>
              {t("Edad")}: {userData.edad || "--"}
            </Text>
            <Text style={styles.text}>
              {t("Género")}: {userData.genero || "--"}
            </Text>
            <Text style={styles.text}>
  {t("Cinturón")}:{" "}
  <Text style={{ color: beltColors[userData.cinturon.toLowerCase()] }}>
    {capitalize(userData.cinturon)}
  </Text>
</Text>

            {/* Muestra la cant. actual de entrenos */}
            <Text style={[styles.text, { marginTop: 8 }]}>
              {t("Entrenamientos")}: {allTime}
            </Text>

            {/* TextInput para Ajustar entrenamientos manualmente */}
            <View
              style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}
            >
              <TextInput
                style={styles.manualInput}
                keyboardType="numeric"
                value={manualCheckIns}
                onChangeText={setManualCheckIns}
                placeholder="Cantidad"
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={handleSaveManual}
              >
                <Text style={styles.adjustButtonText}>
                  {t("Ajustar")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Dan actual */}
            <Text style={[styles.text, { marginTop: 8, fontWeight: "bold" }]}>
              {t("Dan actual")}: {danLabel}
            </Text>
            <Text style={[styles.text, { marginBottom: 10 }]}>
              {countInGroup}/{groupSize} {t("entrenamientos")}
            </Text>

            {/* Dans completados en ESTE cinturón */}
            {danCompletes.length > 0 && (
              <>
               <Text style={[styles.text, { fontWeight: "bold", marginTop: 8 }]}>
  {t("Dans Completados del Cinturon")}{" "}
  <Text style={{ color: beltColors[userData.cinturon.toLowerCase()] }}>
    {capitalize(userData.cinturon)}
  </Text>
</Text>
                <View style={styles.dansContainer}>{danCompletionUI}</View>
              </>
            )}
          </View>
        )}

        {/* PUNTUACIONES */}
        <View style={styles.fixedRatingContainer}>
          {averageRating && (
            <View style={styles.averageContainer}>
              <Text style={styles.averageText}>
                {t("Promedio de Puntuaciones:")} {averageRating}/10
              </Text>
            </View>
          )}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>{t("Puntuacion")}:</Text>
            <StarRating
              rating={score}
              onChange={setScore}
              maxStars={10}
              color="#f1c40f"
              starSize={25}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitRating}
            >
              <Text style={styles.submitButtonText}>
                {t("Enviar Puntuación")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Historial de Puntuaciones (Dropdown) */}
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setRatingsHistoryExpanded(!ratingsHistoryExpanded)}
        >
          <Text style={styles.dropdownHeaderText}>
            {t("Historial de Puntuaciones")}
          </Text>
          <Icon
            name={ratingsHistoryExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#333"
          />
        </TouchableOpacity>

        {ratingsHistoryExpanded && ratings.length === 0 && (
          <Text style={[styles.text, { textAlign: "center", marginVertical: 8 }]}>
            {t("No hay puntuaciones aún.")}
          </Text>
        )}
      </View>

      {/* 
        2) SWIPE LISTVIEW PARA MOSTRAR EL HISTORIAL DE PUNTUACIONES 
        (sin ListHeaderComponent)
      */}
      <SwipeListView
        // Para que no se cierre el teclado al tocar dentro de la lista:
        keyboardShouldPersistTaps="handled"

        data={ratingsHistoryExpanded ? ratings : []}
        keyExtractor={(item) => item.id}
        renderItem={renderFrontItem}
        renderHiddenItem={renderHiddenItem}
        disableLeftSwipe={false}
        disableRightSwipe={false}
        leftOpenValue={400}
        rightOpenValue={-100}
        onSwipeValueChange={handleSwipeValueChange}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        // SIN ListHeaderComponent, pues movimos todo el contenido afuera
        ListFooterComponent={
          Object.keys(groupedByYear).length > 0 ? (
            <View>
              {Object.keys(groupedByYear)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map((year) => (
                  <View key={year} style={styles.yearContainer}>
                    <TouchableOpacity
                      onPress={() => toggleYear(year)}
                      style={styles.yearRow}
                    >
                      <Text style={styles.yearText}>
                        {t("Año")} {year}
                      </Text>
                      <Icon
                        name={
                          expandedYear === year ? "chevron-up" : "chevron-down"
                        }
                        size={20}
                        color="#333"
                      />
                    </TouchableOpacity>
                    {expandedYear === year && (
                      <View style={styles.monthContainer}>
                        {groupedByYear[year]
                          .sort((a, b) => dayjs(a.month).diff(dayjs(b.month)))
                          .map(({ month, count }) => {
                            const formattedMonth = dayjs(month).format("MMMM");
                            const firstCap =
                              formattedMonth.charAt(0).toUpperCase() +
                              formattedMonth.slice(1);
                            return (
                              <View key={month} style={styles.monthRow}>
                                <Text style={styles.monthText}>{firstCap}</Text>
                                <Text style={styles.countText}>{count}</Text>
                              </View>
                            );
                          })}
                      </View>
                    )}
                  </View>
                ))}
            </View>
          ) : (
            <Text style={styles.text}>{t("No hay datos de historial disponibles")}</Text>
          )
        }
      />
    </View>
    </TouchableWithoutFeedback>
  );
}

// ----------------------------------
// ESTILOS
// ----------------------------------
const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownHeader: {
    backgroundColor: "#eaeaea",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    alignItems: "center",
  },
  dropdownHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  dropdownContent: {
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: Platform.select({ android: -4, ios: 4 }),
    color: "#333",
  },
  fixedRatingContainer: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    marginBottom: 10,
  },
  averageContainer: {
    alignItems: "center",
    marginBottom: 5,
  },
  averageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  ratingContainer: {
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "bold",
  },
  submitButton: {
    marginTop: 10,
    backgroundColor: "#3498db",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  rowFront: {
    backgroundColor: "#fff",
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowBack: {
    flex: 1,
    backgroundColor: "red",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  backRightBtn: {
    backgroundColor: "red",
    width: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  backTextWhite: {
    color: "#fff",
    fontWeight: "bold",
  },
  ratingScore: {
    fontSize: 16,
    color: "#333",
  },
  ratingDate: {
    fontSize: 14,
    color: "#999",
  },
  yearContainer: {
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    padding: 10,
  },
  yearRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  yearText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  monthContainer: {
    paddingLeft: 20,
    paddingTop: 10,
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  monthText: {
    fontSize: 16,
    color: "#333",
  },
  countText: {
    fontSize: 16,
    color: "#888",
  },
  dansContainer: {
    marginVertical: 10,
    marginBottom: Platform.select({ android: -20, ios: 4 }),
  },
  danItem: {
    fontSize: 15,
    marginBottom: 2,
    color: "#333",
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 10,
    color: "#000",
  },
  adjustButton: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adjustButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
