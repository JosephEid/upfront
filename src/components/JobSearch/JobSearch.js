import React, { useEffect, useState } from 'react'
import { Form, Button, Row, Col } from 'react-bootstrap';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';

import './JobSearch.scss';

const JobSearch = (props) => {
  const options = Array.from({length: 10}, (_, i) => i + 1).map((value) => 
    <option value={value*10000}>{`£${value}0,000`}</option>
  );

  const [jobValue, setJobValue] = useState("");
  const [value, setLocValue] = useState("");
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(Infinity);
  const [maxOptions, setMaxOptions] = useState(options);
  // eslint-disable-next-line
  const [minOptions, setMinOptions] = useState(options);

  useEffect(() => {
    let newMaxOptions = [];
    let changeNeeded = false;

    maxOptions.forEach(option => {
      if (option.props.value < minValue && option.props.disabled !== true)
      {
        changeNeeded = true;
        newMaxOptions.push({
          ...option,
          props: {
            ...option.props,
            disabled: true
          }
        });
      } else if (option.props.value > minValue && option.props.disabled === true) {
        newMaxOptions.push({
          ...option,
          props: {
            ...option.props,
            disabled: false
          }
        });
      } else {
        newMaxOptions.push(option);
      };
    });
    if (changeNeeded && minValue > maxValue)
    {
      setMaxValue(minValue);
    }
    setMaxOptions(newMaxOptions);
    // eslint-disable-next-line
  }, [minValue]);

  return (
    <Form onSubmit="return false" className="job-search-form">
      <Row>
        <Col>
          <Form.Control value={jobValue} onChange={e => setJobValue(e.target.value)} placeholder="Job title, keywords" required/>
        </Col>
        <Col>
          <div>
            <GooglePlacesAutocomplete
              className="form-control"
              selectProps={{
                placeholder: "Location",
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
                    textAlign: 'left',
                    color: '#495057',
                    backgroundColor: '#fff',
                    backgroundClip: 'padding-box',
                    border: 'none',
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
          <Form.Control value={minValue} onChange={e => setMinValue(e.target.value)} as="select">
            <option hidden>Minimum Salary</option>
            <option value={null}>No min</option>
            {minOptions}
          </Form.Control>
        </Col>
        <Col>
          <Form.Control value={maxValue} onChange={e => setMaxValue(e.target.value)} as="select">
            <option hidden>Maximum Salary</option>
            <option value={null}>No max</option>
            {maxOptions}
          </Form.Control>
        </Col>
        <div className="form-button">
          <Button onClick={() => props.fetchPostings()}>
            Search
          </Button>
        </div>
      </Row>
    </Form>
  );
};

export default JobSearch;