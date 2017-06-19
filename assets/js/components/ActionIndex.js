import React from 'react'
import _ from 'lodash'
import { Link } from 'react-router-dom'
import { Table } from './DataTable'
import { titles } from '../TitleManager'
import { ActionCollection } from '../Model'

import ModelIndex from './ModelIndex'

export default class ActionIndex extends React.Component {
  constructor(props) {
    super(props);
    this.actions = new ActionCollection();
    this.actions.on('add remove change', () => this.forceUpdate());
    this.actions.fetch();
  }

  componentDidMount() {
    titles.setSubtitle("Actions");
  }

  render() {
    const actionRows = _.map(this.actions.models, action => (
      <tr key={action.cid}>
        <td><Link to={`/organize/action/${action.id}`}>{action.name}</Link></td>
        <td>{action.date}</td>
      </tr>
    ))
    return (
      <div>
        <h1>Actions</h1>
        <table className="data-table hover">
          <tr>
            <th>Name</th>
            <th>Date</th>
          </tr>
          {actionRows}
        </table>
      </div>
    )
  }
}
