import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/brand.css";
import "./styles/app.css";
import App from "./App.jsx";
import { installStore } from "./bootstrap.js";

installStore();
createRoot(document.getElementById("root")).render(<App />);
