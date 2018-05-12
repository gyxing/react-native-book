import React, { Component } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
  DrawerLayoutAndroid,
  ScrollView,
  RefreshControl,
} from 'react-native'
import { connect } from 'react-redux'
import { Icon, Toast, Modal } from 'antd-mobile'
import { CachedImage } from 'react-native-cached-image'
import { Button, Header, AppFont, Touchable } from '../components'
import { NavigationActions, createAction, defaultImg, appWidth } from '../utils'
import Account from './Account'

@connect(({ book, loading }) => ({ ...book, ...loading }))
export default class extends Component {
  onRefresh = () => {
    this.props.dispatch(createAction('book/refresh')({}))
  }

  onSearch = () => {
    this.props.dispatch(NavigationActions.navigate({ routeName: 'Search' }))
  }

  onItemClick = item => {
    if (!item.url) {
      Toast.loading('初次阅读，正在加载章节列表...', 0)
      this.props.dispatch(
        createAction('book/searchBookUrl')({
          book: item,
          onSuccess: () => {
            Toast.hide()
            this.props.dispatch(
              NavigationActions.navigate({
                routeName: 'Read',
                params: { id: item.id },
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
          params: { id: item.id },
        })
      )
    }
    this.props.dispatch(
      createAction('book/updateBook')({
        book: item,
        params: { hasNew: 0 },
      })
    )
  }

  onLongClick = item => {
    Modal.operation([
      {
        text: (
          <Text>
            <Icon type={AppFont.info} size={16} color="#07F" />
            <Text> 详情</Text>
          </Text>
        ),
        onPress: () => {
          this.props.dispatch(
            NavigationActions.navigate({ routeName: 'Detail', params: item })
          )
        },
        style: { textAlign: 'center' },
      },
      {
        text: (
          <Text>
            <Icon type={AppFont.del} size={18} color="#07F" />
            <Text> 删除</Text>
          </Text>
        ),
        onPress: () => {
          this.props.dispatch(createAction('book/removeBook')({ id: item.id }))
        },
        style: { textAlign: 'center' },
      },
    ])
  }

  render() {
    return (
      <DrawerLayoutAndroid
        ref={ref => (this.drawer = ref)}
        drawerWidth={appWidth * 0.85}
        keyboardDismissMode="on-drag"
        renderNavigationView={() => <Account />}
      >
        {this.renderContent()}
      </DrawerLayoutAndroid>
    )
  }

  renderContent = () => {
    const { bookList } = this.props
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={this.onRefresh} />
        }
      >
        <Header
          title="书架"
          left={
            <Touchable onPress={() => this.drawer.openDrawer()}>
              <Icon type={AppFont.menu} color="#666" />
            </Touchable>
          }
        />
        <View style={styles.list}>
          {bookList.map((item, i) => (
            <Touchable
              key={i}
              style={styles.item}
              onPress={() => this.onItemClick(item)}
              onLongPress={() => this.onLongClick(item)}
            >
              <CachedImage
                source={{ uri: item.img }}
                defaultSource={defaultImg}
                style={[{ width: 90, height: 125 }]}
              />
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.title}>
                {item.progress ? item.progress : '0.00%'}
              </Text>
              {item.hasNew ? (
                <View style={styles.new}>
                  <Text style={styles.newTxt}>有更新</Text>
                </View>
              ) : null}
            </Touchable>
          ))}
          <Touchable style={styles.item} onPress={this.onSearch}>
            <View style={[styles.center, styles.add]}>
              <Icon type={AppFont.add} size={50} color="#eee" />
            </View>
          </Touchable>
        </View>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  item: {
    width: appWidth / 3,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  add: {
    borderColor: '#ddd',
    borderWidth: 0.5,
    width: 90,
    height: 125,
  },
  title: {
    color: '#444',
  },
  new: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 45,
    width: 50,
    paddingVertical: 1,
    backgroundColor: '#ff2827',
    borderRadius: 3,
  },
  newTxt: {
    color: '#fff',
    fontSize: 12,
  },
})
