import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import ReporterApp from "./reporter/ReporterApp.tsx";

export const AppRouter = createBrowserRouter([
  {
    path: "/",
    element: <App />
  },
  {
    path: "/reporter",
    element: <ReporterApp />
  }
]);
