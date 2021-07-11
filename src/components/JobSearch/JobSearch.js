import React, { useEffect, useState } from 'react'
import { Form, Button, InputGroup } from 'react-bootstrap';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import { isMobile } from 'react-device-detect';

import './JobSearch.scss';

const JobSearch = () => {
  const options = Array.from({length: 10}, (_, i) => i + 1).map((value) => 
    <option value={value*10000}>{`£${value}0,000`}</option>
  );

  const [jobValue, setJobValue] = useState("");
  const [value, setLocValue] = useState("");
  const [minValue, setMinValue] = useState(undefined);
  const [maxValue, setMaxValue] = useState(undefined);
  const [maxOptions, setMaxOptions] = useState(options);
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
  }, [minValue]);

  const startSearch = () => {
    console.log(jobValue);
    console.log(value);
    console.log(minValue);
    console.log(maxValue);
  }

  const Content = () => {
    return (
      <React.Fragment>
        <Form.Control value={jobValue} onChange={e => setJobValue(e.target.value)} placeholder="Job title, keywords" />
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
                  color: '#495057',
                  backgroundColor: '#fff',
                  backgroundClip: 'padding-box',
                  border: '1px solid #ced4da',
                  transition: 'border-color .15s ease-in-out,box-shadow .15s ease-in-out',
                  borderRadius: 0
                })
              },  
            }}
            debounce={1000}
          />
        </div>
        <Form.Control value={minValue} onChange={e => setMinValue(e.target.value)} as="select">
          <option value={undefined} hidden>Minimum Salary</option>
          <option value={0}>No Min</option>
          {minOptions}
        </Form.Control>
        <Form.Control value={maxValue} onChange={e => setMaxValue(e.target.value)} as="select">
          <option value={Infinity}>No Max</option>
          <option value={undefined} hidden>Maximum Salary</option>
          {maxOptions}
        </Form.Control>
        {isMobile ? (
          <Button type="submit">
            Search
          </Button>
        ) : (
          <InputGroup.Append>
            <Button type="submit">
              Search
            </Button>
          </InputGroup.Append>
        )}
      </React.Fragment>
    );
  };

  return (
    <Form onSubmit={() => startSearch()} className="job-search-form">
      {isMobile ? (
        <Content />
      ) : (
        <InputGroup>
          <Content />
        </InputGroup>
      )}
    </Form>
  );
};

export default JobSearch;