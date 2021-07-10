import React from 'react'
import { Container, Jumbotron } from 'react-bootstrap';
import JobSearch from '../JobSearch/JobSearch';

import './Home.scss';

const Home = () => {
  return (
    <Jumbotron>
      <Container>
      <h1>Hello!</h1>
      <p>
        Welcome to HonestJobs, where all Job Postings must contain a salary range.
      </p>
      <JobSearch />
      </Container>
    </Jumbotron>
  );
};

export default Home;