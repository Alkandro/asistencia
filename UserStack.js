// UserStack.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AppDrawer from "./Drawer";

const Stack = createStackNavigator();

const UserStack = ({ monthlyCheckInCount, fetchMonthlyCheckInCount }) => {
  return (
    <Stack.Navigator initialRouteName="Drawer">
      <Stack.Screen 
        name="Drawer" 
        options={{ headerShown: false, headerTitleAlign: "center" }}
      >
        {(props) => (
          <AppDrawer
            {...props}
            monthlyCheckInCount={monthlyCheckInCount}
            fetchMonthlyCheckInCount={fetchMonthlyCheckInCount}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default UserStack;
