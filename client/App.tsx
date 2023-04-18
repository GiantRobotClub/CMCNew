import React from "react";
import "./style/App.css";
import "./style/bigcard.css";
import "./style/editor.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Default from "./Pages/Default";
import Cmc from "./Pages/Cmc";
import DualClient from "./Pages/Game";
import CPUClient from "./Pages/VsCPU";
import DualCpu from "./Pages/cpuvcpu";
import MultiClient from "./Pages/multi";
import LobbyCustom from "./Pages/Lobby";
import CreatePlayer from "./Pages/CreatePlayer";
import Home from "./Pages/Home";
import Test from "./Pages/Test";
import CardEdit from "./Pages/CardEdit";
import SessionHandler from "./CMCComponents/SessionHandler";
import AllCards from "./Pages/AllCards";
import DeckManager from "./Pages/Decks";
import Craft from "./Pages/Crafting";
import OnePlayer from "./Pages/OnePlayer";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Default />} />
        <Route path="/play/:mid/:pid/:cred" element={<Cmc />} />
        <Route path="/lobby" element={<LobbyCustom />} />
        <Route path="/decks/:deckid" element={<DeckManager />} />
        <Route path="/decks" element={<DeckManager />} />
        <Route path="/public" />
        <Route path="/player/create" element={<CreatePlayer />} />
        <Route path="/home" element={<Home />} />
        <Route path="/Craft" element={<Craft />} />
        <Route path="/1P" element={<OnePlayer />} />
        <Route path="/1P/:pid/:enemy" element={<CPUClient />} />

        <Route path="/test" element={<Test />} />
        <Route path="/allcards" element={<AllCards />} />
        <Route path="/edit" element={<CardEdit />} />
        <Route path="/game" element={<DualClient />} />
        <Route path="/playcpu" element={<CPUClient />} />
        <Route path="/play2cpu" element={<DualCpu />} />
        <Route path="/multi/:id" element={<MultiClient />} />
      </Routes>
    </Router>
  );
}

export default App;
