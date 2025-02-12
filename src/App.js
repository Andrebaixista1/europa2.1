// src/App.js
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import TableComponent from "./components/TableComponent";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <div>
      <TableComponent />
      <ToastContainer position="top-right" />
    </div>
  );
}

export default App;
