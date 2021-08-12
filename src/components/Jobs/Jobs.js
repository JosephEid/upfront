import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import logo from '../../images/logonewsmall.svg';

import './Jobs.scss';

const Jobs = (props) => {
  return (
    <div>
      <Row xs={1} md={2} className="g-4">
        {props.postings.map(posting => (
          <Col>
            <Card>
              <Card.Body>
                <Row>
                  <Col xs={3} style={{paddingRight: "0px"}}>
                    <img src={logo} className="card-logo" alt="company logo, this needs to be populated!"/>
                  </Col>
                  <Col style={{paddingLeft: "0px", textAlign: "left"}}>
                    <Card.Title style={{marginBottom: "0.5rem"}}>{posting.title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">Google</Card.Subtitle>
                    <Card.Subtitle style={{fontSize: "14px"}}className="mb-3 text-muted">{posting.location}</Card.Subtitle>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Card.Text style={{textAlign: "left", fontSize: "14px", overflowY: "hidden"}}>
                      {posting.description}
                    </Card.Text>
                  </Col>
                </Row>
                <Card.Link href="#">Card Link</Card.Link>
                <Card.Link href="#">Another Link</Card.Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Jobs;