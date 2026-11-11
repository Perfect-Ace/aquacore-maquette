import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import "./index.css";
import { AdminShell } from "@/components/admin-shell";
import { StoreProvider } from "@/data/store";
import { AnalyticsPage } from "@/pages/analytics";
import { BonDetailPage } from "@/pages/bon-detail";
import { BonsPage } from "@/pages/bons";
import { DashboardPage } from "@/pages/dashboard";
import { DriverPage, DriverPickPage } from "@/pages/driver";
import { LoginPage } from "@/pages/login";
import { NewBonPage } from "@/pages/new-bon";

const router = createBrowserRouter([
  { path: "/", element: <LoginPage /> },
  {
    path: "/admin",
    element: <AdminShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "bons", element: <BonsPage /> },
      { path: "bons/nouveau", element: <NewBonPage /> },
      { path: "bons/:id", element: <BonDetailPage /> },
      { path: "analyse", element: <AnalyticsPage /> },
    ],
  },
  { path: "/chauffeur", element: <DriverPickPage /> },
  { path: "/chauffeur/:driverId", element: <DriverPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
], { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <RouterProvider router={router} />
    </StoreProvider>
  </StrictMode>,
);
