import React from 'react'
import { Container } from 'react-bootstrap';
import CreatePostingForm from '../CreatePostingForm/CreatePostingForm';

import './CreatePosting.scss';

const CreatePosting = () => {
  return (
    <Container className="h-opaque">
      <h1>Create Job Posting</h1>
      <p>
        Welcome to HonestJobs, where recruiters and companies are required to include a salary range for any job posting.
      </p>
      <p>
        Start your search for honest job postings below!
      </p>
      <CreatePostingForm />
    </Container>
  );
};

export default CreatePosting;