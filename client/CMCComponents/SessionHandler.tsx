import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// check if you are logged in, if not send to login.
const SessionHandler = () => {
  const nav = useNavigate();

  useEffect(() => {
    fetch("/api/manage/player/getsession")
      .then((response) => response.json())
      .then((data) => {
        if (data.playerid !== "") {
          console.log("Found player id: ", data.playerid);
        } else {
          // return to login screen
          nav("/");
        }
      });
  });
  return <></>;
};

export default SessionHandler;
