import React from 'react'
import _ from 'lodash'
import { Link } from 'react-router-dom'
import { titles } from '../TitleManager'
import { RaisedButton, CardActions, Divider, Card, CardHeader, CardText, Avatar } from 'material-ui'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import ContentCreate from 'material-ui/svg-icons/content/create'
import TextTruncate from 'react-text-truncate'
import ActivistCard from './ActivistCard'
import { fetchActions } from '../actions'
import { connect } from 'react-redux'
import { getAllModels, getLoading, getActions } from '../selectors'

export const ActionCard = (props) => {
  const total = props.action.signups.length;
  const toPct = (v) => (v/total)*100+"%"
  const segments = ["prospective", "contacted", "confirmed", "attended", "noshow", "cancelled"];
  const segmentDivs = _.map(segments, segment => {
    const count = props.action.signups.filter(s => s.state == segment).length
    return (
      <div key={segment} style={{width: toPct(count)}} className={segment} />
    )
  })
  const progressBar = (
    <div className="bottom-bar">
      {segmentDivs}
    </div>
  )
  const description = props.action.description
  const recentSignups = _.map(_.slice(props.action.signups, 0, 5), signup => (
    <ActivistCard key={signup.cid} activist={signup.activist} />
  ));
  return (
    <Card className="card" key={props.action.cid} >
        <CardHeader
          actAsExpander={true}
          showExpandableButton={true}
          subtitle={props.action.date.fromNow()}
          title={props.action.name}
          avatar={<Avatar>{props.action.signups.length}</Avatar>} />
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
          <Link to={`/organize/action/${props.action.id}`}>
            <RaisedButton primary={true} label="Open" />
          </Link>
        </CardActions>
        {progressBar}
    </Card>
  )
}



export class ActionIndexBase extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(fetchActions());
  }

  render() {
    const actionRows = _.map(this.props.actions, action => <ActionCard action={action} />)
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

const mapStateToProps = (state) => {
  return {
    actions: getActions(state),
    loading: getLoading(state),
  }
}

const ActionIndex = connect(mapStateToProps)(DragDropContext(HTML5Backend)(ActionIndexBase));
export default ActionIndex;
