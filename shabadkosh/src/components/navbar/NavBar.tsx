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
  const { t } = useTranslation();

  return (
    <div>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand href={routes.home}>{t('KOSH')}</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href={routes.home}>{t('HOME')}</Nav.Link>
              <NavDropdown
                title="Words"
                id="basic-nav-dropdown"
              >
                <NavDropdown.Item href={routes.words}>{t('ALL_WORDS')}</NavDropdown.Item>
                <NavDropdown.Item href={routes.newWord}>{t('ADD_WORD')}</NavDropdown.Item>
              </NavDropdown>
              <NavDropdown
                title="Wordlists"
                id="basic-nav-dropdown"
              >
                <NavDropdown.Item href={routes.wordlists}>{t('ALL_WORDLISTS')}</NavDropdown.Item>
                <NavDropdown.Item href={routes.newWordlist}>{t('ADD_WORDLIST')}</NavDropdown.Item>
              </NavDropdown>
              <Nav.Link href={routes.search}>{t('SEARCH')}</Nav.Link>
              <Nav.Link href={routes.about}>{t('ABOUT')}</Nav.Link>
              <Nav.Link href={routes.contact}>{t('CONTACT')}</Nav.Link>
              <NavDropdown title={user?.role === roles.admin ? t('USERS') : t('USER')} id="basic-nav-dropdown-1">
                <NavDropdown.Item href={routes.profile}>{t('PROFILE')}</NavDropdown.Item>
                <NavDropdown.Item href={routes.users} hidden={user?.role !== roles.admin}>{t('VIEW_USERS')}</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href={routes.login2} hidden={user?.uid}>{t('LOGIN')}</NavDropdown.Item>
                <NavDropdown.Item href={routes.logout} hidden={!user?.uid}>{t('LOGOUT')}</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
};

export default NavBar;
