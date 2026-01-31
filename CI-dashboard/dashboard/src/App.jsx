import React from "react";
import Mainpage from "./pages/Mainpage";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./pages/ProtectedRoute";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";

const App = () => {
  return (
    <>
      <Router>
        <Routes>
          {/* public routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pin"
            element={
              <ProtectedRoute>
                <Mainpage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
