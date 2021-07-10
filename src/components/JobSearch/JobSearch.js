import React, { useState } from 'react'
import { Form, Row, Col, Button } from 'react-bootstrap';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';

import './JobSearch.scss';

const JobSearch = () => {
  const [jobValue, setJobValue] = useState("");
  const [value, setLocValue] = useState("");
  const [minValue, setMinValue] = useState(null);
  const [maxValue, setMaxValue] = useState(null);

  const salaryValues = Array.from({length: 10}, (_, i) => i + 1);

  const dropdownOptions = salaryValues.map((value) => 
    <option value={value*10000}>{`£${value}0,000`}</option>
  );

  const startSearch = () => {
    console.log(jobValue);
    console.log(value);
    console.log(minValue);
    console.log(maxValue);
  }

  return (
    <Form onSubmit={() => startSearch()} className="job-search-form">
      <Row>
        <Col>
          <Form.Label>The role</Form.Label>
          <Form.Control value={jobValue} onChange={e => setJobValue(e.target.value)} placeholder="Job title, keywords" />
        </Col>
        <Col>
          <Form.Label>The location</Form.Label>
          <div>
            <GooglePlacesAutocomplete
              className="form-control"
              selectProps={{
                value,
                onChange: setLocValue,
                styles: {
                  input: () => ({
                    width: '8em'
                  }),
                  control: (provided) => ({
                    ...provided,
                    width: '100%',
                    height: 'calc(1.5em + .75rem + 2px)',
                    fontSize: '1rem',
                    fontWeight: '400',
                    lineHeight: '1.5',
                    color: '#495057',
                    backgroundColor: '#fff',
                    backgroundClip: 'padding-box',
                    border: '1px solid #ced4da',
                    borderRadius: '.25rem',
                    transition: 'border-color .15s ease-in-out,box-shadow .15s ease-in-out',
                    borderRadius: 0
                  })
                },  
              }}
              debounce={1000}
            />
          </div>
        </Col>
        <Col>
          <Form.Label>Min. Salary</Form.Label>
          <Form.Control value={minValue} onChange={e => setMinValue(e.target.value)} as="select">
            <option value={null}>No min</option>
            {dropdownOptions}
          </Form.Control>
        </Col>
        <Col>
          <Form.Label>Max. Salary</Form.Label>
          <Form.Control value={maxValue} onChange={e => setMaxValue(e.target.value)} as="select">
            <option value={null}>No max</option>
            {dropdownOptions}
          </Form.Control>
        </Col>
        <Col>
          <Button type="submit">
            Search
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default JobSearch;