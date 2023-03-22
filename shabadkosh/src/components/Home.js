import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useUserAuth } from "./UserAuthContext";

const Home = () => {
  const { logOut } = useUserAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/");
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <>
      <div className="p-4 box mt-3 text-center">
        It&apos;s a nice day for Gurmukhi ! <br />
      </div>
      <div className="d-grid gap-2 col-6 mx-auto">
        <Button variant="primary" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </>
  );
};

export default Home;
