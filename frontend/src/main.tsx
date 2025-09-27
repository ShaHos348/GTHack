import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App';
import Temp from './Temp';

import './index.css';
import PatientHistory from './pages/PatientHistory';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/temp',
    element: <Temp />,
    /*children: [
      {
        path: '/profiles/:profileId',
        element: <ProfilePage />,
      },
    ],*/
  },
  {
    path: '/patienthistory',
    element: <PatientHistory />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);