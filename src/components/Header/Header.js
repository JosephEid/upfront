import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import logo from '../../images/logonew.svg';

import './Header.scss';

const Header = () => {
  return (
    <Navbar expand="lg" sticky="top">
      <Navbar.Brand href="#home">
        <img src={logo} alt="HonestJobs" width="200"/>
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link href="#home">Home</Nav.Link>
          <Nav.Link href="#link">Jobs</Nav.Link>
        </Nav>
        <Nav inline>
          <NavDropdown title="Sign in" id="basic-nav-dropdown">
            <NavDropdown.Item href="#action/3.1">Sign In</NavDropdown.Item>
            <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
            <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Header;