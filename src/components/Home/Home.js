import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import JobSearch from '../JobSearch/JobSearch';
import { listPostings } from '../../graphql/queries';
import { API } from 'aws-amplify';

import './Home.scss';
import Jobs from '../Jobs/Jobs';

const Home = () => {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchPostings() {
    setLoading(true);
    const apiData = await API.graphql({ query: listPostings });
    setLoading(false);

    setPostings(apiData.data.listPostings.items);
  }

  return (
    <React.Fragment>
      <Container className="h-opaque">
        <h1 style={{textAlign: "left"}}>Salary Matters...</h1>
        <p style={{textAlign: "left"}}>Start your search for job postings which <span>must contain salaries</span></p>
        <JobSearch fetchPostings={x => fetchPostings(x)}/>
      </Container>
      <Container className="h-opaque">
        {loading ? (
          <p>LOADING...</p>
        ): (
          <Jobs postings={postings}/>
        )}
      </Container>
    </React.Fragment>
  );
};

export default Home;