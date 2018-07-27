import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
} from 'react-native'
import { CachedImage } from 'react-native-cached-image'
import { Icon, Toast } from 'antd-mobile-rn'
import { Button, Header, AppFont, Touchable } from '../components'
import {
  appHeight,
  defaultImg,
  createAction,
  NavigationActions,
} from '../utils'

@connect(({ book, loading }) => ({ ...book, ...loading }))
export default class extends Component {
  constructor(props) {
    super(props)
    const { params } = props.navigation.state
    this.state = {
      label: '加入书架',
      book: params,
    }
  }

  onToRead = () => {
    const { book } = this.state
    if (!book.url) {
      Toast.loading('初次阅读，正在加载章节列表...', 0)
      this.props.dispatch(
        createAction('book/searchBookUrl')({
          book,
          onSuccess: () => {
            Toast.hide()
            this.props.dispatch(
              NavigationActions.navigate({
                routeName: 'Read',
                params: { id: book.id },
              })
            )
          },
          onError: () => {
            Toast.fail('缺乏资源，无法阅读', 1)
          },
        })
      )
    } else {
      this.props.dispatch(
        NavigationActions.navigate({
          routeName: 'Read',
          params: { id: book.id },
        })
      )
    }
    this.props.dispatch(
      createAction('book/updateBook')({
        book,
        params: { hasNew: 0 },
      })
    )
  }

  onAddToList = () => {
    this.setState({ label: '正在加入...' })
    this.props.dispatch(
      createAction('book/addBook')({
        book: this.state.book,
        callback: book => {
          this.setState({ book })
        },
      })
    )
  }

  render() {
    return (
      <View style={styles.container}>
        <Header back style={{ borderBottomWidth: 0 }} />
        {this.renderContent()}
        {this.renderFooter()}
      </View>
    )
  }

  renderContent = () => {
    const { name, author, type, status, desc, img } = this.state.book
    return (
      <ScrollView style={{ height: appHeight - 100 }}>
        <View style={styles.flex}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <CachedImage
              source={{ uri: img }}
              defaultSource={defaultImg}
              style={{ width: 90, height: 125 }}
            />
          </View>
          <View style={{ flex: 2 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.info}>作者：{author}</Text>
            <Text style={styles.info}>类型：{type}</Text>
            <Text style={styles.info}>更新状态：{status}</Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ color: '#333' }}>简介：</Text>
          <Text style={{ paddingVertical: 10, paddingLeft: 20 }}>{desc}</Text>
        </View>
      </ScrollView>
    )
  }

  renderFooter = () => {
    const { bookList } = this.props
    const { book, label } = this.state
    const books = bookList.filter(
      item => item.name === book.name && item.author === book.author
    )
    const isHas = books.length > 0
    const flag = label === '正在加入...'
    return (
      <View style={styles.footer}>
        <Touchable
          disabled={!isHas}
          style={[styles.center, { flex: 1 }]}
          onPress={this.onToRead}
        >
          <Text style={isHas ? { color: '#0095fd' } : { color: '#999' }}>
            开始阅读
          </Text>
        </Touchable>
        <Touchable
          disabled={isHas || flag}
          style={[styles.center, { flex: 1 }]}
          onPress={this.onAddToList}
        >
          <Text style={isHas ? { color: '#999' } : { color: '#0095fd' }}>
            {isHas ? '已添加' : label}
          </Text>
        </Touchable>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flexDirection: 'row',
    paddingVertical: 25,
    marginBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  info: {
    marginVertical: 3,
    color: '#444',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    height: 60,
    flexDirection: 'row',
    borderTopColor: '#eee',
    borderTopWidth: 0.5,
  },
})
