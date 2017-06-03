import React from 'react'
import { APIListDataStore } from './RowDataStore'
import StoreBinding from './StoreBinding'
import { Table } from './DataTable'
import { Link } from 'react-router-dom'
import { titles } from '../TitleManager'

export default class ActionIndex extends React.PureComponent {
  constructor(props) {
    super(props);
    this.store = new APIListDataStore('/api/actions/')
    this.store.reload();
  }

  componentDidMount() {
    titles.setSubtitle("Actions");
  }

  render() {
    const columns = [
      {label: "Name",
       value: "name",
       cell: ({row:{id, name}}) => <Link to={`/organize/action/${id}`}>{name}</Link>},
      {label: "Date",
       value: "date"},
      {label: "Signups",
       value: "signups.length"}
    ];
    return (
      <StoreBinding store={this.store}>
        <Table columns={columns} />
      </StoreBinding>
    )
  }
}
