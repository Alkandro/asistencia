import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { db, auth } from "../firebase";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { 
  AdminCard, 
  AdminButton, 
  AdminBadge, 
  AdminHeader,
  AdminListItem,
  AdminLoadingOverlay 
} from "./AdminComponents";

const UserListScreen = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    const usersRef = collection(db, "users");

    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const userList = [];
        snapshot.forEach((docSnap) => {
          const userData = docSnap.data();
          if (userData.role !== "admin") {
            userList.push({ id: docSnap.id, ...userData });
          }
        });
        
        // Ordenar por entrenamientos nuevos (descendente) y luego por nombre
        userList.sort((a, b) => {
          const aTrainings = a.newTrainings || 0;
          const bTrainings = b.newTrainings || 0;
          
          if (aTrainings !== bTrainings) {
            return bTrainings - aTrainings; // Descendente por entrenamientos
          }
          
          const aName = a.nombre || a.username || "";
          const bName = b.nombre || b.username || "";
          return aName.localeCompare(bName); // Ascendente por nombre
        });
        
        setUsers(userList);
        setLoading(false);
      },
      (error) => {
        console.error("Error al obtener usuarios:", error);
        Alert.alert("Error", "No se pudo obtener la lista de usuarios");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUserPress = async (user) => {
    // Resetear badge de entrenamientos nuevos
    if (user.newTrainings > 0) {
      try {
        await updateDoc(doc(db, "users", user.id), { newTrainings: 0 });
      } catch (error) {
        console.error("Error al resetear badge:", error);
      }
    }
    
    navigation.navigate("UserDetailScreen", { userId: user.id });
  };

  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // La actualización se maneja automáticamente por onSnapshot
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getBeltColor = (belt) => {
    const colors = {
      white: "#F3F4F6",
      blue: "#3B82F6",
      purple: "#8B5CF6",
      brown: "#A16207",
      black: "#111827",
    };
    return colors[belt?.toLowerCase()] || colors.white;
  };

  const getBeltTextColor = (belt) => {
    const darkBelts = ["purple", "brown", "black"];
    return darkBelts.includes(belt?.toLowerCase()) ? "#fff" : "#111827";
  };

  const renderUserItem = ({ item, index }) => {
    const isExpanded = expandedUsers[item.id];
    const beltColor = getBeltColor(item.cinturon);
    const beltTextColor = getBeltTextColor(item.cinturon);
    const hasNewTrainings = (item.newTrainings || 0) > 0;

    return (
      <AdminCard style={[styles.userCard, hasNewTrainings && styles.userCardHighlight]}>
        {/* Header del usuario */}
        <TouchableOpacity 
          onPress={() => handleUserPress(item)}
          style={styles.userHeader}
        >
          <View style={styles.userInfo}>
            {/* Avatar con inicial */}
            <View style={[styles.userAvatar, { backgroundColor: beltColor }]}>
              <Text style={[styles.userAvatarText, { color: beltTextColor }]}>
                {(item.nombre || item.username || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            
            {/* Información principal */}
            <View style={styles.userMainInfo}>
              <Text style={styles.userName}>
                {item.nombre || item.username || "Usuario sin nombre"}
              </Text>
              <Text style={styles.userBelt}>
                {item.cinturon ? `Cinturón ${item.cinturon}` : "Sin cinturón"}
              </Text>
              <Text style={styles.userTrainings}>
                {item.allTimeCheckIns || 0} entrenamientos totales
              </Text>
            </View>
          </View>

          {/* Badge y flecha */}
          <View style={styles.userActions}>
            {hasNewTrainings && (
              <AdminBadge count={item.newTrainings} style={styles.userBadge} />
            )}
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                toggleUserExpansion(item.id);
              }}
              style={styles.expandButton}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Detalles expandidos */}
        {isExpanded && (
          <View style={styles.userDetails}>
            <View style={styles.userDetailRow}>
              <Text style={styles.userDetailLabel}>Usuario:</Text>
              <Text style={styles.userDetailValue}>{item.username || "No registrado"}</Text>
            </View>
            <View style={styles.userDetailRow}>
              <Text style={styles.userDetailLabel}>Apellido:</Text>
              <Text style={styles.userDetailValue}>{item.apellido || "No registrado"}</Text>
            </View>
            <View style={styles.userDetailRow}>
              <Text style={styles.userDetailLabel}>Email:</Text>
              <Text style={styles.userDetailValue}>{item.email || "No registrado"}</Text>
            </View>
            <View style={styles.userDetailRow}>
              <Text style={styles.userDetailLabel}>Teléfono:</Text>
              <Text style={styles.userDetailValue}>{item.phone || "No registrado"}</Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => handleUserPress(item)}
              style={styles.viewDetailsButton}
            >
              <Text style={styles.viewDetailsButtonText}>Ver detalles completos</Text>
              <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        )}
      </AdminCard>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No hay usuarios registrados</Text>
      <Text style={styles.emptyStateSubtitle}>
        Los usuarios aparecerán aquí cuando se registren en la aplicación
      </Text>
    </View>
  );

  const renderHeader = () => (
    <AdminHeader
      title="Usuarios"
      subtitle={`${users.length} usuario${users.length !== 1 ? 's' : ''} registrado${users.length !== 1 ? 's' : ''}`}
      rightComponent={
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#6B7280" />
        </TouchableOpacity>
      }
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />

   
      <AdminLoadingOverlay visible={loading} text="Cargando usuarios..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Espacio para el botón de cerrar sesión
  },
  userCard: {
    marginBottom: 12,
  },
  userCardHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  userMainInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  userBelt: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  userTrainings: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  userActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  userBadge: {
    marginRight: 8,
  },
  expandButton: {
    padding: 8,
  },
  userDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  userDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  userDetailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    flex: 1,
  },
  userDetailValue: {
    fontSize: 14,
    color: "#111827",
    flex: 2,
    textAlign: "right",
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  viewDetailsButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3B82F6",
    marginRight: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  refreshButton: {
    padding: 8,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  signOutButton: {
    width: "100%",
  },
});

export default UserListScreen;

