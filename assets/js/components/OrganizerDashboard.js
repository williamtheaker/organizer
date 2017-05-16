import React from 'react'

import { Card, CardHeader, CardText} from 'material-ui'
import { connect } from 'react-redux'
import Model from '../store/model'
import _ from 'lodash'

import { getCurrentUser } from '../selectors'

const People = new Model('people')

class OrganizerDashboardBase extends React.Component {
    componentDidMount() {
        this.props.people.fetchAll()
    }

    render() {
        const keys = _.keys(this.props.currentPerson)
        const metadata = _.map(keys, k => {
            return (<p key={k}>{k} = {JSON.stringify(_.get(this.props.currentPerson, k))}</p>)
        })
        console.log(this.props.currentPerson, metadata)
        const name = _.get(this.props.currentPerson, 'name', '')
        return (
            <Card>
                <CardHeader
                    title={name}
                    subtitle={this.props.currentUser.email} />
                <CardText>
                    <h1>Raw data</h1>
                    {metadata}
                </CardText>
            </Card>
        )
    }
}

const mapStateToProps = state => {
    const currentUser = getCurrentUser(state)
    const currentPerson = People.select(state).filterBy('email', currentUser.email).first()
    return {
        currentUser,
        currentPerson
    }
}

const mapDispatchToProps = dispatch => {
    return {
        people: People.bindActionCreators(dispatch)
    }
}


const OrganizerDashboard = connect(mapStateToProps, mapDispatchToProps)(OrganizerDashboardBase)

export default OrganizerDashboard
