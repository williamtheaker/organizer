import React from 'react'
import StoreBinding from './StoreBinding'
import { APIListDataStore } from './RowDataStore'
import { Table } from './DataTable'
import { titles } from '../TitleManager'

export default class ActivistIndex extends React.Component {
  constructor(props) {
    super(props);
    this.store = new APIListDataStore('/api/activists/');
    this.store.reload();
  }

  componentDidMount() {
    titles.setSubtitle("Activists");
  }

  render() {
    return (
      <StoreBinding store={this.store}>
        <Table />
      </StoreBinding>
    )
  }
}
