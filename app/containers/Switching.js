import React, { Component } from 'react'
import { connect } from 'react-redux'
import { StyleSheet, View, Text } from 'react-native'
import { Header } from '../components'

@connect(({ book, loading }) => ({ ...book, ...loading }))
export default class extends Component {
  constructor(props) {
    super(props)
    this.book = props.navigation.state.params
  }

  render() {
    return (
      <View style={styles.container}>
        <Header back title="切换下载源" />
        <View
          style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}
        >
          <Text style={{ fontSize: 20, color: '#ff5640' }}>待开发...</Text>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
})
