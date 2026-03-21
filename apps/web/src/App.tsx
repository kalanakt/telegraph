import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { BotDetail } from "./pages/BotDetail";
import { Bots } from "./pages/Bots";
import { FlowEditor } from "./pages/FlowEditor";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Navigate to="/bots" replace /> },
      { path: "bots", element: <Bots /> },
      { path: "bots/:botId", element: <BotDetail /> },
      { path: "bots/:botId/flows/:flowId", element: <FlowEditor /> },
    ],
  },
]);
