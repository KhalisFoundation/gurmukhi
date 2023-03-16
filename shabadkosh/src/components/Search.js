import React, { Component } from "react";

export class Search extends Component {
  render() {
    return (
      <div>
        <form>
          <input type="text" name="search" placeholder="Search" />
          <input type="submit" value="Search" />
        </form>
      </div>
    );
  }
}

export default Search;
