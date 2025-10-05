import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import DocumentUpload from "./DocumentsUpload";

function App() {
  return (
    <>
      <div className="app-container">
        <h1>Document Upload & Viewer</h1>
        <DocumentUpload />
      </div>
    </>
  );
}

export default App;
