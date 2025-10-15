import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import ManagerApp from "./manager/ManagerApp";

export const AppRouter = createBrowserRouter([
  {
    path: "/",
    element: <App />
  },
  {
    path: "/manager",
    element: <ManagerApp />
  }
]);
