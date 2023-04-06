import React from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Default from "./Default";
import Cmc from "./Cmc";
import DualClient from "./Game";
import CPUClient from "./VsCPU";
import MultiClient from "./multi";
import LobbyReact from "./LobbyReact";
import LobbyCustom from "./Lobby";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/game" element={<DualClient />} />
        <Route path="/" element={<Default />} />
        <Route path="/play" element={<Cmc />} />
        <Route path="/playcpu" element={<CPUClient />} />
        <Route path="/multi/:id" element={<MultiClient />} />
        <Route path="/lobby" element={<LobbyCustom />} />
        <Route path="/lobbyreact" element={<LobbyReact />} />
        <Route path="/public" />
      </Routes>
    </Router>
  );
}

export default App;
