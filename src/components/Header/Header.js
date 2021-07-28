import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import logo from '../../images/logonew.svg';
import { Link } from 'react-router-dom';

import './Header.scss';

const Header = () => {
  return (
    <Navbar expand="lg" sticky="top">
      <Link to="/" className="h-navbarbrand" replace>
        <img src={logo} alt="HonestJobs" width="200"/>
      </Link>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <Link to="/" className="h-navlink" replace>
            Home
          </Link>
        </Nav>
        <Nav inline={+true}>
          <NavDropdown alignRight title="Sign in" id="basic-nav-dropdown" flip={+true}>
            <NavDropdown.Item href="#action/3.1">Sign In</NavDropdown.Item>
            <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
            <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
            <NavDropdown.Divider />
            <Link to="/CreatePosting" className="h-dropdownitem" replace>
              Create Job Posting
            </Link>
          </NavDropdown>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Header;