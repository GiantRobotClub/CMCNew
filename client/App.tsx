import React from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Default from "./Default";
import Cmc from "./Cmc";
import DualClient from "./Game";
import CPUClient from "./VsCPU";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/game" element={<DualClient />} />
        <Route path="/" element={<Default />} />
        <Route path="/play" element={<Cmc />} />
        <Route path="/playcpu" element={<CPUClient />} />
        <Route path="/public" />
      </Routes>
    </Router>
  );
}

export default App;
