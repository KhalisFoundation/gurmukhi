import React, { Component } from "react";
import { Button } from "react-bootstrap";
// import { Card } from "react-bootstrap";

// export class Home extends Component {
//   render() {
//     return (
//       <div>
//         <Card>
//           <Card.Body>
//             <Card.Title>ਸ਼ਬਦਕੋਸ਼</Card.Title>
//             <Card.Text>
//               Shabad Kosh is a simple tool to build a Gurmukhi Dictionary.
//             </Card.Text>
//             <Card.Text>It is a work in progress.</Card.Text>
//           </Card.Body>
//         </Card>
//       </div>
//     );
//   }
// }

// export default Home;

import { useNavigate } from "react-router";
import { useUserAuth } from "./UserAuthContext";

const Home = () => {
  const { logOut, user } = useUserAuth();
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
