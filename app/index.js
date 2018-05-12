import React from 'react'
import { AppRegistry, AsyncStorage } from 'react-native'
import createLoading from 'dva-loading'
import RNStorage from 'react-native-storage'

import dva from './utils/dva'
import Router, { routerMiddleware } from './router'

import appModel from './models/app'
import routerModel from './models/router'
import bookModel from './models/book'

console.ignoredYellowBox = [
  'Warning: componentWillMount is deprecated',
  'Warning: componentWillReceiveProps is deprecated',
  'Warning: componentWillUpdate is deprecated',
]

const storage = new RNStorage({
  size: 100000, // 最大容量，默认值100000条数据循环存储
  storageBackend: AsyncStorage,
  defaultExpires: null,
  enableCache: true,
})
global._storage = storage

const app = dva({
  ...createLoading(),
  initialState: {},
  models: [appModel, routerModel, bookModel],
  onAction: [routerMiddleware],
  onError(e) {
    console.log('onError', e)
  },
})

const App = app.start(<Router />)

AppRegistry.registerComponent('DvaStarter', () => App)
