import { useState } from "react";
import "./App.css";
import React from "react";
import { useNavigate } from "react-router-dom";
import qrcode from "qrcode";
function Default() {
  const [name, setName] = useState("");
  const [isLog, setIsLog] = useState(false);
  const navigate = useNavigate();
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    //authenticate.
    setIsLog(true);
    event.preventDefault();
    const form = event.currentTarget;
    const formElements = form.elements as typeof form.elements & {
      username: { value: string };
      authcode: { value: string };
    };

    const username = formElements.username.value;
    const authcode = formElements.authcode.value;
    fetch("/api/manage/player/login/" + username + "/" + authcode)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setName(username);
          navigate("/home");
          setIsLog(false);
        }
      });
  }

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <label>
          your name:
          <input type="text" name="username" />
        </label>
        <label>
          authenticator code:
          <input type="text" name="authcode" />
        </label>
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
}

export default Default;
