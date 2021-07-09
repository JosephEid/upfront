import React from 'react'
import Jumbotron from 'react-bootstrap/Jumbotron';
import Button from 'react-bootstrap/Button';

import './Home.css';

const Home = () => {
  return (
    <Jumbotron>
      <h1>Hello!</h1>
      <p>
        Welcome to HonestJobs, where all Job Postings must contain a salary range.
      </p>
      <p>
        <Button variant="primary">Learn more</Button>
      </p>
    </Jumbotron>
  );
};

export default Home;