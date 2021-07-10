import React from 'react'
import Jumbotron from 'react-bootstrap/Jumbotron';
import { Form, Col, Row } from 'react-bootstrap';
import './Home.css';

const Home = () => {
  const salaryValues = Array.from({length: 10}, (_, i) => i + 1);

  const dropdownOptions = salaryValues.map((value) => 
    <option value={value*10000}>{`£${value}0,000`}</option>
  );

  return (
    <Jumbotron>
      <h1>Hello!</h1>
      <p>
        Welcome to HonestJobs, where all Job Postings must contain a salary range.
      </p>
      <p>
      <Form class="job-search-form">
        <Row>
          <Col>
            <Form.Control placeholder="Job title, keywords or company" />
          </Col>
          <Col>
            <Form.Control placeholder="Where" />
          </Col>
          <Col>
            <Form.Control as="select">
              <option>No min</option>
              {dropdownOptions}
            </Form.Control>
          </Col>
          <Col>
            <Form.Control as="select">
              <option>No max</option>
              {dropdownOptions}
            </Form.Control>
          </Col>
        </Row>
      </Form>
      </p>
    </Jumbotron>
  );
};

export default Home;