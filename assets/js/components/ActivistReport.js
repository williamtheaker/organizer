import React from 'react'
import StoreBinding from './StoreBinding'
import RowDataStore from './RowDataStore'
import { Table } from './DataTable'
import axios from 'axios'
import { titles } from '../TitleManager'

class ActivistStore extends RowDataStore {
  reload() {
    console.log("updating activists");
    return axios.get('/api/activists/')
    .then((results) => {
      this.setData(results.data);
      console.log(results.data);
      return results;
    });
  }

  allItems() {
    if (this.data.results) {
      return this.data.results;
    } else {
      return [];
    }
  }
}

export default class ActivistReport extends React.Component {
  constructor(props) {
    super(props);
    this.store = new ActivistStore();
  }

  componentDidMount() {
    this.store.reload();
    titles.setTitle("Activist Report", "");
  }

  render() {
    return (
      <StoreBinding store={this.store}>
        <Table />
      </StoreBinding>
    )
  }
}
