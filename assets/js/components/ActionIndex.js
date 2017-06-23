import React from 'react'
import _ from 'lodash'
import { Link } from 'react-router-dom'
import { titles } from '../TitleManager'
import { ActionCollection } from '../Model'
import { Card, CardHeader, CardText, Avatar } from 'material-ui'
import ContentCreate from 'material-ui/svg-icons/content/create'

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
    console.log('signups', _.map(this.actions.models, f => f.signups));
    const actionRows = _.map(this.actions.models, action => {
      const total = action.signups.length;
      const prospective = action.signups.filter(s => s.state == "prospective").length
      const contacted = action.signups.filter(s => s.state == "contacted").length
      const confirmed = action.signups.filter(s => s.state == "confirmed").length
      const attended = action.signups.filter(s => s.state == "attended").length
      const noshow = action.signups.filter(s => s.state == "noshow").length
      const cancelled = action.signups.filter(s => s.state == "cancelled").length
      const toPct = (v) => (v/total)*100+"%"
      const progressBar = (
        <div className="bottom-bar">
          <div style={{width: toPct(prospective)}} className="prospective" />
          <div style={{width: toPct(contacted)}} className="contacted" />
          <div style={{width: toPct(confirmed)}} className="confirmed" />
          <div style={{width: toPct(attended)}} className="attended" />
          <div style={{width: toPct(noshow)}} className="noshow" />
          <div style={{width: toPct(cancelled)}} className="cancelled" />
        </div>
      )
      return (
        <Card style={{margin: '1rem'}} key={action.cid}>
          <Link to={`/organize/action/${action.id}`}>
            <CardHeader subtitle={action.date.fromNow()} title={action.name} avatar={<Avatar>{action.signups.models.length}</Avatar>} />
            <CardText>
            </CardText>
            {progressBar}
          </Link>
        </Card>
      )
    })
    const addAction = (
      <Card style={{margin: '1rem'}}>
        <Link to={`/organize/action/new`}>
          <CardHeader avatar={<Avatar icon={<ContentCreate />}/>}title="Create new action" />
          <CardText>
            Create a new action, get signups, change the game.
          </CardText>
        </Link>
      </Card>
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
