import React from 'react'
import { TextField } from 'material-ui'
import MarkdownEditor from './MarkdownEditor'
import { saveAction, updateAction } from '../actions'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { getCurrentAction } from '../selectors'

function mapStateToProps(state) {
  return {
    action: getCurrentAction(state),
    loaded: !state.actions.loading
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveAction, updateAction}, dispatch)
}

const ActionEditor = connect(mapStateToProps, mapDispatchToProps)(props => (
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
))
export default ActionEditor
