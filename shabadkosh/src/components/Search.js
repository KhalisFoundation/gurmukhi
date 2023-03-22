import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";

const Search = () => {
  const [query, setQuery] = useState("");

  const handleSearch = async (event) => {
    event.preventDefault();
    // make API request using axios or another library
    // set state with search results
  };

  return (
    <Form onSubmit={handleSearch}>
      <Form.Group controlId="formBasicSearch">
        <Form.Label>Search</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter search term"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Form.Group>
      <Button variant="primary" type="submit">
        Search
      </Button>
    </Form>
  );
};

export default Search;
