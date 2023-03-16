import React, { Component } from "react";
import { Card } from "react-bootstrap";

export class Home extends Component {
  render() {
    return (
      <div>
        <Card>
          <Card.Body>
            <Card.Title>ਸ਼ਬਦਕੋਸ਼</Card.Title>
            <Card.Text>
              Shabad Kosh is a simple tool to build a Gurmukhi Dictionary.
            </Card.Text>
            <Card.Text>It is a work in progress.</Card.Text>
          </Card.Body>
        </Card>
      </div>
    );
  }
}

export default Home;
