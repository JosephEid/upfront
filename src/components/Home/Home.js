import React from 'react'
import { Container, Jumbotron } from 'react-bootstrap';
import JobSearch from '../JobSearch/JobSearch';

import './Home.scss';

const Home = () => {
  return (
    <Jumbotron>
      <Container className="h-opaque">
        <h1>Salary Matters...</h1>
        <p>
          Welcome to HonestJobs, where recruiters and companies are required to include a salary range for any job posting.
        </p>
        <p>
          Start your search for honest job postings below!
        </p>
        <JobSearch />
      </Container>
    </Jumbotron>
  );
};

export default Home;