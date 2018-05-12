import React, { Component } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import PropTypes from 'prop-types'
import { Icon } from 'antd-mobile'
import AppFont from './AppFont'
import Touchable from './Touchable'
import { NavigationActions, createAction } from '../utils'

export default ({
  style = {},
  children,
  title,
  back = false,
  left,
  right,
  noRight,
}) => (
  <View style={[styles.container, style]}>
    {back ? (
      <Touchable
        style={styles.left}
        onPress={() => _dispatch(NavigationActions.back())}
      >
        <Icon type={AppFont.left} color="#666" />
      </Touchable>
    ) : left ? (
      <View style={styles.left}>{left}</View>
    ) : null}
    <View style={styles.center}>
      {children || <Text style={{ fontSize: 18, color: '#333' }}>{title}</Text>}
    </View>
    {!noRight && (back || left || right) ? (
      <View style={styles.right}>{right}</View>
    ) : null}
  </View>
)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 45,
    borderBottomColor: '#ddd',
    borderBottomWidth: 0.5,
  },
  left: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
  },
  center: {
    flex: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 10,
  },
})
