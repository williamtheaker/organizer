import React from 'react'
import _ from 'lodash'
import { Link } from 'react-router-dom'
import { titles } from '../TitleManager'
import { bindToCollection, ActionCollection } from '../Model'
import { RaisedButton, CardActions, Divider, Card, CardHeader, CardText, Avatar } from 'material-ui'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import ContentCreate from 'material-ui/svg-icons/content/create'
import TextTruncate from 'react-text-truncate'
import ActivistCard from './ActivistCard'

export class ActionIndexBase extends React.Component {
  constructor(props) {
    super(props);
    this.actions = new ActionCollection();
    this.state = {actions: []}
    bindToCollection(this, this.actions, 'actions');
    this.actions.fetch();
  }

  componentDidMount() {
    titles.setSubtitle("Actions");
  }

  render() {
    const actionRows = _.map(this.state.actions, action => {
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
      const description = (action.forms.length > 0) ? action.forms[0].description : "No description";
      const recentSignups = _.map(_.slice(action.signups.models, 0, 5), signup => (
        <ActivistCard key={signup.cid} activist={signup.activist} />
      ));
      return (
        <Card className="card" key={action.cid} >
            <CardHeader
              actAsExpander={true}
              showExpandableButton={true}
              subtitle={action.date.fromNow()}
              title={action.name}
              avatar={<Avatar>{action.signups.models.length}</Avatar>} />
            <CardText expandable={true}>
              <h2>Recent Signups</h2>
              <div className="recent">
                {recentSignups}
              </div>
              <p />
              <Divider />
              <p />
              <TextTruncate line={4} text={description} />
            </CardText>
            <CardActions>
              <Link to={`/organize/action/${action.id}`}>
                <RaisedButton primary={true} label="Open" />
              </Link>
            </CardActions>
            {progressBar}
        </Card>
      )
    })
    const addAction = (
      <Card className="card">
        <Link to={`/organize/action/new`}>
          <CardHeader avatar={<Avatar icon={<ContentCreate />}/>}title="Create new action" />
          <CardText>
            Start a new action, get signups.
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

const ActionIndex = DragDropContext(HTML5Backend)(ActionIndexBase);
export default ActionIndex;
