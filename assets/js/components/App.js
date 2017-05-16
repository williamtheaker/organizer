import React from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'

import Footer from './Footer'
import importedComponent from 'react-imported-component'
import ThemeProvider from 'material-ui/styles/MuiThemeProvider'

import { hot } from 'react-hot-loader'

const LazyOrganizerIndex = importedComponent(() => import('./OrganizerIndex'))

const LazyAppIndex = importedComponent(() => import('./AppIndex'))

const SLACK_LOGIN_URL = window.SLACK_LOGIN_URL || ''

const App = (_props) => (
    <ThemeProvider>
        <Router>
            <div>
                <Route path="/organize" component={LazyOrganizerIndex} />
                <Route exact path="/" component={LazyAppIndex} />
                <Footer slackUrl={SLACK_LOGIN_URL} />
            </div>
        </Router>
    </ThemeProvider>
)

export default hot(module)(App)
