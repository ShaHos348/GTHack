import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App";
import Temp from "./Temp";

import "./index.css";
import PatientHistory from "./components/PatientHistory";
import Bananas from "./pages/PatientDashboard";
import PatientDashBoard from "./pages/PatientDashboard";

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
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
