import React, { Component } from "react";
import { Card } from "react-bootstrap";

export class About extends Component {
  render() {
    return (
      <div>
        <Card>
          <Card.Body>
            <Card.Title>About Khalis Foundation</Card.Title>
            <Card.Text>
              Khalis Foundation is a non-profit organization that builds tech
              consumed by the global Sikh community.
            </Card.Text>
          </Card.Body>
        </Card>
      </div>
    );
  }
}

export default About;
