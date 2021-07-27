/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createPosting = /* GraphQL */ `
  mutation CreatePosting(
    $input: CreatePostingInput!
    $condition: ModelPostingConditionInput
  ) {
    createPosting(input: $input, condition: $condition) {
      id
      title
      description
      location
      minSalary
      maxSalary
      createdBy
      updatedBy
      createdAt
      updatedAt
    }
  }
`;
export const updatePosting = /* GraphQL */ `
  mutation UpdatePosting(
    $input: UpdatePostingInput!
    $condition: ModelPostingConditionInput
  ) {
    updatePosting(input: $input, condition: $condition) {
      id
      title
      description
      location
      minSalary
      maxSalary
      createdBy
      updatedBy
      createdAt
      updatedAt
    }
  }
`;
export const deletePosting = /* GraphQL */ `
  mutation DeletePosting(
    $input: DeletePostingInput!
    $condition: ModelPostingConditionInput
  ) {
    deletePosting(input: $input, condition: $condition) {
      id
      title
      description
      location
      minSalary
      maxSalary
      createdBy
      updatedBy
      createdAt
      updatedAt
    }
  }
`;
