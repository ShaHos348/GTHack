import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App";
import Temp from "./Temp";

import "./index.css";
import PatientHistory from "./components/PatientHistory";
import PatientDashBoard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/temp",
    element: <Temp />,
    /*children: [
      {
        path: '/profiles/:profileId',
        element: <ProfilePage />,
      },
    ],*/
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
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
