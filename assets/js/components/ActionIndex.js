import React from 'react'
import _ from 'lodash'
import { Link } from 'react-router-dom'
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
      <div className="card" key={action.cid}>
        <Link to={`/organize/action/${action.id}`}>
          <div className="right"><div className="badge">{action.signups.length}</div></div>
          <div className="title">{action.name}</div>
          {action.date.fromNow()}
        </Link>
      </div>
    ))
    const addAction = (
      <div className="card">
        <Link to={`/organize/action/new`}>
          <div className="title">Create new action</div>
          Create a new action, get signups, change the game.
        </Link>
      </div>
    )
    return (
      <div>
        <h1>Actions</h1>
        <div className="action-list">
          {addAction}
          {actionRows}
        </div>
      </div>
    )
  }
}
