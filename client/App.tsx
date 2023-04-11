import React from "react";
import "./App.css";
import "./bigcard.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Default from "./Default";
import Cmc from "./Cmc";
import DualClient from "./Game";
import CPUClient from "./VsCPU";
import DualCpu from "./cpuvcpu";
import MultiClient from "./multi";
import LobbyCustom from "./Lobby";
import CreatePlayer from "./CreatePlayer";
import Home from "./Home";
import Test from "./Test";
import CardEdit from "./CardEdit";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/game" element={<DualClient />} />
        <Route path="/" element={<Default />} />
        <Route path="/play/:mid/:pid/:cred" element={<Cmc />} />
        <Route path="/playcpu" element={<CPUClient />} />
        <Route path="/play2cpu" element={<DualCpu />} />
        <Route path="/multi/:id" element={<MultiClient />} />
        <Route path="/lobby" element={<LobbyCustom />} />
        <Route path="/public" />
        <Route path="/player/create" element={<CreatePlayer />} />
        <Route path="/home" element={<Home />} />
        <Route path="/test" element={<Test />} />
        <Route path="/edit" element={<CardEdit />} />
      </Routes>
    </Router>
  );
}

export default App;
