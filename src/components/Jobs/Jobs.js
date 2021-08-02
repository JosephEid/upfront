import React, { useEffect, useState } from 'react'
import { listPostings } from '../../graphql/queries';
import { API } from 'aws-amplify';
import { Card, CardGroup } from 'react-bootstrap';

const Jobs = () => {
  const [postings, setPostings] = useState([]);

  useEffect(() => {
    if (postings.length === 0) 
    {
      fetchPostings();
    }
  });

  async function fetchPostings() {
    const apiData = await API.graphql({ query: listPostings });
    console.log(apiData);
    setPostings(apiData.data.listPostings.items);
  }

  return (
    <div>
      <CardGroup>
      {
        postings.map(posting => (
          <Card style={{ width: '18rem' }}>
            <Card.Body>
              <Card.Title>{posting.title}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">{posting.location}</Card.Subtitle>
              <Card.Text>
                {posting.description}
              </Card.Text>
              <Card.Link href="#">Card Link</Card.Link>
              <Card.Link href="#">Another Link</Card.Link>
            </Card.Body>
          </Card>
        ))
      }
      </CardGroup>
    </div>
  );
};

export default Jobs;