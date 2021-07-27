/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getPosting = /* GraphQL */ `
  query GetPosting($id: ID!) {
    getPosting(id: $id) {
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
export const listPostings = /* GraphQL */ `
  query ListPostings(
    $filter: ModelPostingFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPostings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
    }
  }
`;
