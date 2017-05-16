import React from 'react'
import { connect } from 'react-redux'
import Model from '../store/model'
import Selectable from '../store/select'
import Filterable from '../store/filter'
import _ from 'lodash'
import { Form } from 'informed'
import { TextField, Toolbar, ToolbarGroup, RaisedButton } from 'material-ui'
import MaterialFormText from './MaterialFormText'

const People = new Model('people')

const PeopleSelector = new Selectable('people')

const PeopleFilter = new Filterable('people', p => _.get(p.address, 'raw', 'California') + ' ' + p.name + ' ' + p.tags.join(',') + ' ' + p.email)

const mapStateToProps = state => {
    return {
        allPeople: People.select(state).all(),
        selection: PeopleSelector.selected(state),
        filtered: PeopleFilter.filtered(state, People.select(state).all().slice),
    }
}

const mapDispatchToProps = dispatch => {
    return {
        people: People.bindActionCreators(dispatch),
        selector: PeopleSelector.bindActionCreators(dispatch),
        filter: PeopleFilter.bindActionCreators(dispatch),
    }
}

const mapTaggerDispatchToProps = dispatch => {
    return {
        removeTag: (formApi) => {
            dispatch((dispatch, getState) => {
                const selectedPeople = PeopleSelector.selected(getState())
                _.each(selectedPeople, id => {
                    dispatch(People.updateAndSave(id, person => ({
                        ...person,
                        tags: _.without(person.tags, formApi.getValue('tag'))
                    })))
                })
            })
        },
        addTag: (formApi) => {
            dispatch((dispatch, getState) => {
                const selectedPeople = PeopleSelector.selected(getState())
                _.each(selectedPeople, id => {
                    dispatch(People.updateAndSave(id, person => ({
                        ...person,
                        tags: [...person.tags, formApi.getValue('tag')]
                    })))
                })
            })
        }
    }
}

const Tagger = connect(() => ({}), mapTaggerDispatchToProps)(props => (
    <Form>
        {({formApi}) => (
            <React.Fragment>
                <MaterialFormText hintText="Tag" field="tag" />
                <RaisedButton onClick={() => props.removeTag(formApi)} type="submit">Remove tag</RaisedButton>
                <RaisedButton onClick={() => props.addTag(formApi)} value="add" type="submit">Add tag</RaisedButton>
            </React.Fragment>
        )}
    </Form>
))

const PeopleIndex = connect(mapStateToProps, mapDispatchToProps)(props => {
    const people = _.map(props.filtered, (person, idx) => {
        const tags = _.map(person.tags, tag => (
            <span key={tag} className="tag">{tag}</span>
        ))
        return (
            <tr key={person.id} className={idx % 2 == 0 ? 'even' : 'odd'}>
                <td><input type="checkbox" checked={props.selection.indexOf(person.id) != -1} onChange={() => props.selector.toggle(person.id)}/></td>
                <td>{person.name}<p>{tags}</p></td>
                <td>{person.email}</td>
                <td>{_.get(person.address, 'raw', 'California')}</td>
            </tr>
        )
    })
    return (
        <div>
            <h1>People</h1>
            <Toolbar>
                <ToolbarGroup>
                    <RaisedButton onClick={() => props.people.fetchAll()}>Load</RaisedButton>
                </ToolbarGroup>
                <ToolbarGroup>
                    <Tagger />
                </ToolbarGroup>
                <ToolbarGroup>
                    <TextField hintText="Search" onChange={e => props.filter.set(e.target.value)} />
                </ToolbarGroup>
            </Toolbar>
            <table>
                <thead>
                    <tr>
                        <th colSpan="2">Name</th>
                        <th>Email</th>
                        <th>Address</th>
                    </tr>
                </thead>
                <tbody>
                    {people}
                </tbody>
            </table>
        </div>
    )
})

export default PeopleIndex
