import React, { Component } from 'react'

import { Route, Switch, Redirect } from 'react-router'
import { BrowserRouter } from 'react-router-dom'

import { Provider } from 'react-redux'

import '../styles/index.css'

import createStore from '../store/store'

import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'

import StartingScreen from './StartingScreen'
import ResultScreen from './ResultScreen'
import ToastContainer from '../components/Toasts/ToastContainer'

const store = createStore()

const parseQueryString = (queryString) => {
  const params = {}
  queryString.length && queryString.slice(1).split('&').forEach(p => {
    const param = p.split('=')
    params[param[0]] = param[1] ? param[1] : true
  })
  return params
}

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <div id="wrapper">
          <BrowserRouter>
            <Switch>
              <Route exact path="/" render={props => {
                const params = parseQueryString(props.location.search)
                if (params.testId) {
                  return <Redirect from="/" to={`/test/${params.testId}/result`} exact />
                }
                return (
                  <div id="main">
                    <div className="content">
                      <StartingScreen { ...props } />
                    </div>
                    <Footer />
                  </div>
                )
              }}/>
              <Redirect from='/test/' to='/' exact />
              <Route exact path="/test/:testId" render={props => (
                <div id="main">
                  <div className="content">
                    <StartingScreen { ...props } />
                  </div>
                  <Footer />
                </div>
              )}/>
              <Route exact path="/test/:testId/result" render={props => (
                <div id="main">
                  <Navbar />
                  <div className="content">
                    <ResultScreen { ...props } />
                  </div>
                  <Footer/>
                </div>
              )}/>
            </Switch>
          </BrowserRouter>
          <ToastContainer />
        </div>
      </Provider>
    )
  }
}

export default App