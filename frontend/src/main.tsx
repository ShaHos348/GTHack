import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App";

import "./index.css";
import PatientHistory from "./components/PatientHistory";
import PatientDashBoard from "./pages/PatientDashboard";
import PatientInfo from "./components/PatientInfo";
import DoctorDashboard from "./pages/DoctorDashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/patienthistory",
    element: <PatientHistory />,
  },
  {
    path: "/patientdashboard",
    element: <PatientDashBoard />,
  },
  {
    path: "/doctordashboard",
    element: <DoctorDashboard />,
  },
  {
    path: "/patient/:patiendId",
    element: <PatientInfo />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
