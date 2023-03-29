import React from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Default from "./Default";
import Game from "./Game";
import Cmc from "./Cmc";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/game" element={<Game />} />
        <Route path="/" element={<Default />} />
        <Route path="/play" element={<Cmc />} />
      </Routes>
    </Router>
  );
}

export default App;
