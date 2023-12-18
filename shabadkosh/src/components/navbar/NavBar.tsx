import React from 'react';
import {
  Nav, Navbar, NavDropdown, Container,
} from 'react-bootstrap';

import { useTranslation } from 'react-i18next';
import { useUserAuth } from '../UserAuthContext';
import routes from '../constants/routes';
import roles from '../constants/roles';

const NavBar = () => {
  const { user } = useUserAuth();
  const { t: text } = useTranslation();

  return (
    <div>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand href={routes.home}>{text('KOSH')}</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href={routes.home}>{text('HOME')}</Nav.Link>
              <NavDropdown
                title="Words"
                id="basic-nav-dropdown"
              >
                <NavDropdown.Item href={routes.words}>{text('ALL_WORDS')}</NavDropdown.Item>
                <NavDropdown.Item href={routes.newWord}>{text('ADD_WORD')}</NavDropdown.Item>
              </NavDropdown>
              <NavDropdown
                title="Wordlists"
                id="basic-nav-dropdown"
              >
                <NavDropdown.Item href={routes.wordlists}>{text('ALL_WORDLISTS')}</NavDropdown.Item>
                <NavDropdown.Item href={routes.newWordlist}>{text('ADD_WORDLIST')}</NavDropdown.Item>
              </NavDropdown>
              <Nav.Link href={routes.search}>{text('SEARCH')}</Nav.Link>
              <Nav.Link href={routes.about}>{text('ABOUT')}</Nav.Link>
              <Nav.Link href={routes.contact}>{text('CONTACT')}</Nav.Link>
              <NavDropdown title={user?.role === roles.admin ? text('USERS') : text('USER')} id="basic-nav-dropdown-1">
                <NavDropdown.Item href={routes.profile}>{text('PROFILE')}</NavDropdown.Item>
                <NavDropdown.Item href={routes.users} hidden={user?.role !== roles.admin}>{text('VIEW_USERS')}</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href={routes.login2} hidden={user?.uid}>{text('LOGIN')}</NavDropdown.Item>
                <NavDropdown.Item href={routes.logout} hidden={!user?.uid}>{text('LOGOUT')}</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
};

export default NavBar;
