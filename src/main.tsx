import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/profile-fonts.css";
import "./i18n/config";

console.log("📍 main.tsx loaded");
console.log("📍 Mounting React app...");

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);
console.log("📍 React app mounted successfully");
