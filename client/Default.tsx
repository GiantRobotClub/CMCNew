import { useState } from "react";
import "./App.css";
import React from "react";
import { useNavigate } from "react-router-dom";
import qrcode from "qrcode";
function Default() {
  const [name, setName] = useState(0);
  const navigate = useNavigate();
  function handleSubmit(event) {
    // create or load user

    // get user id

    // add to session

    navigate("/home");
  }
  let qr = "";
  qrcode.toDataURL(
    "otpauth://totp/CMC:9mT5PLt2xNxWEgqKCOy9p?secret=FUTGKJJQKNCR6LJR&period=30&digits=6&algorithm=SHA1&issuer=CMC",
    (err, imgurl) => {
      qr = imgurl;
    }
  );
  return (
    <div className="App">
      <img src={qr} />
      <form onSubmit={handleSubmit}>
        <label>
          your name:
          <input type="text" name="name" />
        </label>
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
}

export default Default;
