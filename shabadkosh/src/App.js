// import { app } from "./firebase";
import React from "react";
import NavBar from "./components/NavBar";
import "bootstrap/dist/css/bootstrap.min.css";
import { UserAuthContextProvider } from "./components/UserAuthContext";
import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";

// signInWithPopup(auth, provider)
//   .then((result) => {
//     // This gives you a Google Access Token. You can use it to access the Google API.
//     const credential = GoogleAuthProvider.credentialFromResult(result);
//     const token = credential.accessToken;
//     console.log(token)
//     // The signed-in user info.
//     const user = result.user;
//     console.log(user)
//     // IdP data available using getAdditionalUserInfo(result)
//     // ...
//   }).catch((error) => {
//     // Handle Errors here.
//     const errorCode = error.code;
//     const errorMessage = error.message;
//     // The email of the user's account used.
//     const email = error.customData.email;
//     // The AuthCredential type that was used.
//     const credential = GoogleAuthProvider.credentialFromError(error);
//     // ...
//   });

function App() {
  return (
    <div className="App">
      <NavBar />
    </div>
  );
}

export default App;
