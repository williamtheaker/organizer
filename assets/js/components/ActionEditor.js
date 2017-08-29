import React from 'react'
import { TextField } from 'material-ui'
import MarkdownEditor from './MarkdownEditor'
import { saveAction, updateAction } from '../actions'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { modelFinder, getActionById, getLoading } from '../selectors'
import Spinner from './Spinner'

function mapStateToProps(state, props) {
  return {
    action: modelFinder('actions', 'id', props.id)(state),
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveAction, updateAction}, dispatch)
}

const ActionEditor = connect(mapStateToProps, mapDispatchToProps)(props => (
  props.action ? (
    <div>
      <h2>
        <TextField
          fullWidth={true}
          floatingLabelText="Title"
          disabled={!props.loaded}
          onBlur={(evt) => props.saveAction(props.action.id)}
          value={props.action.name}
          onChange={(evt) => props.updateAction(props.action.id, {name: evt.target.value})} />
      </h2>
      <MarkdownEditor
        value={props.action.description}
        onChange={v => props.updateAction(props.action.id, {description:v})}
        onBlur={() => props.saveAction(props.action.id)} />
    </div>
  ) : (<Spinner />)
))
export default ActionEditor
