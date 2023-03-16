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
import SearchPage from "./SearchPage";
import ReviewWord from "./words/ReviewWord";
import DeleteWord from "./words/DeleteWord";

import { Navbar, NavDropdown, Container } from "react-bootstrap";

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
              <Nav.Link href="/searchpage">SearchPage</Nav.Link>

              <NavDropdown title="Profile" id="basic-nav-dropdown-1">
                <NavDropdown.Item href="/profile">Profile</NavDropdown.Item>
                <NavDropdown.Item href="/settings">Settings</NavDropdown.Item>
                <NavDropdown.Item href="/login">Login</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="/logout">Logout</NavDropdown.Item>
                <NavDropdown.Divider />
                <Nav.Link href="/about">About</Nav.Link>
                <Nav.Link href="/contact">Contact</Nav.Link>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/home" element={<Home />}></Route>
        <Route path="/about" element={<About />}></Route>
        <Route path="/contact" element={<Contact />}></Route>
        <Route path="/search" element={<Search />}></Route>
        <Route path="/searchpage" element={<SearchPage />}></Route>

        {/* auth */}
        <Route path="/login" element={<Login />}></Route>
        <Route path="/logout" element={<Logout />}></Route>

        {/* user */}
        <Route path="/profile" element={<Profile />}></Route>
        <Route path="/settings" element={<Settings />}></Route>

        {/* words */}
        <Route path="/viewdictionary" element={<ViewDictionary />}></Route>
        <Route path="/worddetail" element={<WordDetail />}></Route>
        <Route path="/addword" element={<AddWord />}></Route>
        <Route path="/editword" element={<EditWord />}></Route>
        <Route path="/reviewword" element={<ReviewWord />}></Route>
        <Route path="/deleteword" element={<DeleteWord />}></Route>
        <Route path="*" element={<h1>404 Not Found</h1>}></Route>
      </Routes>
    </div>
  );
};

export default NavBar;
