import React from 'react'
import ReactDOM from 'react-dom'

import Result from './containers/Result'
import Test from './containers/Test'

import 'promise-polyfill'
import 'whatwg-fetch'

window.speedKitAnalyzer = {
  renderResult: (testId) => {
    ReactDOM.render(<Result testId={testId} />, document.getElementById('speed-kit-analyzer'))
  },
  renderTest: (testId, callback) => {
    ReactDOM.render(<Test testId={testId} onAfterFinish={callback} />, document.getElementById('speed-kit-analyzer'))
  }
}

window.startTest = (url) => fetch(`https://${process.env.REACT_APP_BAQEND}.app.baqend.com/v1/code/bulkTest`, {
  method: 'POST',
  body: JSON.stringify({
    "tests": [{ "url": url, "priority": 0 }]
  }),
  headers: {
    'content-type': 'application/json'
  },
}).then(r => r.json()
  .then(r => r[0].testOverviews[0].replace('/db/TestOverview/', '')
    // fetch(`https://${process.env.REACT_APP_BAQEND}.app.baqend.com/v1${r[0].testOverviews[0]}`).then((r) => r.json())
  )
)

if (process.env.NODE_ENV === 'development') {
  if (process.env.REACT_APP_SCREEN_TYPE === 'result') {
    window.speedKitAnalyzer.renderResult('uECZ6qtest')
  }
  else if (process.env.REACT_APP_SCREEN_TYPE === 'test') {
    window.startTest('www.alibaba.com').then(res => {
      window.speedKitAnalyzer.renderTest(res, () => {
        alert("test finished")
      })
    })
  }
}
