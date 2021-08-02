import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import { API } from 'aws-amplify';

import { createPosting as createPostingMutation } from '../../graphql/mutations';

import './CreatePostingForm.scss';

const CreatePostingForm = () => {
  const [jobValue, setJobValue] = useState("");
  const [value, setLocValue] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  async function createPosting() {
    const posting = {
      title: jobValue,
      description: description,
      location: value.value.description,
      minSalary: minValue,
      maxSalary: maxValue,
      createdBy: "joseph"
    }

    await API.graphql({ query: createPostingMutation, variables: { input: posting } });
  }

  return (
    <Form className="create-posting-form">
      <Form.Group className="mb-3" controlId="formJobTitle">
        <Form.Label>Job title</Form.Label>
        <Form.Control required value={jobValue} onChange={e => setJobValue(e.target.value)} placeholder="e.g. Software Developer, Clinical Psychologist" />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formJobLocation">
        <Form.Label>Job location</Form.Label>
        <div>
          <GooglePlacesAutocomplete
            required
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
                  border: 'none',
                  transition: 'border-color .15s ease-in-out,box-shadow .15s ease-in-out',
                  borderRadius: 0
                })
              },  
            }}
            debounce={1000}
          />
        </div>
      </Form.Group>
      <Form.Group className="mb-3" controlId="formJobMinSalary">
        <Form.Label>
          Minimum salary
        </Form.Label>
        <Form.Control required type="number" value={minValue} onChange={e => setMinValue(e.target.value)} placeholder="e.g. 25000"/>
      </Form.Group>
      <Form.Group className="mb-3" controlId="formJobMaxSalary">
        <Form.Label>
          Maximum salary
        </Form.Label>
        <Form.Control required type="number" value={maxValue} onChange={e => setMaxValue(e.target.value)} placeholder="e.g. 35000"/>
      </Form.Group>
      <Form.Group className="mb-3" controlId="formJobDescription">
        <Form.Label>
          Job Description
        </Form.Label>
        <Form.Control required as="textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="description/responsibilities/requirements"/>
      </Form.Group>
      <Form.Group className="mb-3" controlId="formCompanyLogo">
        <Form.Label>Company Logo</Form.Label>
        <Form.Control value={image} onChange={e => setImage(e.target.value)} type="file" />
      </Form.Group>
      
      <div className="form-button">
        <Button onClick={() => createPosting()}>
          Create
        </Button>
      </div>
    </Form>
  );
};

export default CreatePostingForm;