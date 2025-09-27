import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App";

import "./index.css";
import PatientHistory from "./components/PatientHistory";
import PatientDashBoard from "./pages/PatientDashboard";
import PatientInfo from "./components/PatientInfo";
import DoctorDashboard from "./pages/DoctorDashboard";
import Navigation from "./components/Navigation";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/patienthistory",
    element: <PatientHistory />,
    // element: (
    //   <ProtectedRoute requireRole="patient">
    //     <PatientHistory />
    //   </ProtectedRoute>
    // ),
  },
  {
    path: "/patientdashboard",
    element: <PatientDashBoard />,
    // element: (
    //   <ProtectedRoute requireRole="patient">
    //     <PatientDashBoard />
    //   </ProtectedRoute>
    // ),
  },
  {
    path: "/doctordashboard",
    element: <DoctorDashboard />,
  },
  {
    path: "/navigation",
    element: <Navigation />,
  },
  {
    path: "/patient/:patiendId",
    element: <PatientInfo />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
