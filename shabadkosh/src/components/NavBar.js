import React from "react";
import { Routes, Route } from "react-router-dom";
import { Nav } from "react-bootstrap";
import Home from "./Home";
import ViewDictionary from "./words/ViewDictionary";
import WordDetail from "./words/WordDetail";
import AddWord from "./words/AddWord";
import EditWord from "./words/EditWord";
import Profile from "./user/Profile";
import Settings from "./user/Settings";
import Login from "./auth/Login";
import Logout from "./auth/Logout";
import About from "./About";
import Contact from "./Contact";
import Search from "./Search";
import ReviewWord from "./words/ReviewWord";
import DeleteWord from "./words/DeleteWord";

import { Navbar, NavDropdown, Container } from "react-bootstrap";
import { UserAuthContextProvider } from "./UserAuthContext";
import Signup from "./auth/Signup";
import ProtectedRoute from "./ProtectedRoute";

const NavBar = () => {
  return (
    <div>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand href="/">ShabadKosh</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/home">Home</Nav.Link>
              <NavDropdown
                href="/viewdictionary"
                title="Words"
                id="basic-nav-dropdown"
              >
                <Nav.Link href="/viewdictionary">Dictionary</Nav.Link>
                <Nav.Link href="/addWord">Add Word</Nav.Link>
                <NavDropdown.Divider />
                <NavDropdown.Item href="/reviewword">
                  Review Word
                </NavDropdown.Item>
                <NavDropdown.Item href="/editword">Edit Word</NavDropdown.Item>
                <NavDropdown.Item href="/worddetail">
                  Word Detail
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="/deleteword">
                  Delete word
                </NavDropdown.Item>
              </NavDropdown>
              <Nav.Link href="/search">Search</Nav.Link>
              <Nav.Link href="/about">About</Nav.Link>
              <Nav.Link href="/contact">Contact</Nav.Link>
              <NavDropdown title="Profile" id="basic-nav-dropdown-1">
                <NavDropdown.Item href="/profile">Profile</NavDropdown.Item>
                <NavDropdown.Item href="/settings">Settings</NavDropdown.Item>
                <NavDropdown.Item href="/login">Login</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="/logout">Logout</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <UserAuthContextProvider>
        <Routes>
          <Route path="/" element={<Login />}></Route>

          {/* auth */}
          <Route path="/login" element={<Login />}></Route>
          <Route path="/logout" element={<Logout />}></Route>
          <Route path="/signup" element={<Signup />}></Route>

          {/* general */}
          <Route path="/about" element={<About />}></Route>
          <Route path="/contact" element={<Contact />}></Route>

          {/* Protected ie AuthNeeded */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          ></Route>

          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Search />
              </ProtectedRoute>
            }
          ></Route>

          {/* user */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          ></Route>

          {/* words */}
          <Route
            path="/viewdictionary"
            element={
              <ProtectedRoute>
                <ViewDictionary />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/worddetail"
            element={
              <ProtectedRoute>
                <WordDetail />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/addword"
            element={
              <ProtectedRoute>
                <AddWord />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/editword"
            element={
              <ProtectedRoute>
                <EditWord />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/reviewword"
            element={
              <ProtectedRoute>
                <ReviewWord />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/deleteword"
            element={
              <ProtectedRoute>
                <DeleteWord />
              </ProtectedRoute>
            }
          ></Route>
          {/* The 404 page */}
          <Route path="*" element={<h1>404 Not Found</h1>}></Route>
        </Routes>
      </UserAuthContextProvider>
    </div>
  );
};

export default NavBar;
