import React, { Component } from 'react'
import { connect } from 'react-redux'
import { StyleSheet, View, Text, ScrollView } from 'react-native'
import { Icon } from 'antd-mobile-rn'
import { Header, AppFont, Touchable } from '../components'
import Loading from './Loading'
import {
  appHeight,
  createAction,
  appWidth,
  NavigationActions,
  Storage,
} from '../utils'

@connect(({ book, loading }) => ({ ...book, ...loading }))
export default class extends Component {
  constructor(props) {
    super(props);
    this.book = props.navigation.state.params;
    this.state = {
      dlWay: 'one',
      resourceList: []
    };
  }

  componentDidMount() {
    this.props.dispatch(createAction('book/exchange')({
      book: this.book,
      dlWay: this.state.dlWay,
      callback: (data) => {
        this.setState({resourceList:data})
      }
    }))
  }

  setDlWay = (dlWay) => {
    this.setState({ dlWay })
  };

  onRowClick = (item) => {
    const { dlWay } = this.state;

  };

  render() {
    const { dlWay, resourceList } = this.state;
    return (
      <View style={styles.container}>
        <Header back title="切换下载源" />
        <View style={styles.center}>
          <Touchable style={[styles.center, styles.raItem]} onPress={()=>this.setDlWay('one')}>
            <Icon type={dlWay==='one'? AppFont.checkboxOn:AppFont.checkbox} color={dlWay==='one'?"#07f":"#999"} />
            <Text> 仅当前章节</Text>
          </Touchable>
          <Touchable style={[styles.center, styles.raItem]} onPress={()=>this.setDlWay('more')}>
            <Icon type={dlWay==='more'? AppFont.checkboxOn:AppFont.checkbox} color={dlWay==='more'?"#07f":"#999"} />
            <Text> 剩余章节</Text>
          </Touchable>
        </View>
        {resourceList.length > 0 ? (
          <ScrollView style={{borderTopColor:'#eee', borderTopWidth:0.5}}>
            {resourceList.map( (item,index) => {
              let isCur = this.book.origin === item.origin;
              return (
                <Touchable key={index} style={styles.row} activeOpacity={isCur?1:0.8} onPress={isCur?null:()=>this.onRowClick(item)}>
                  <Text style={styles.name}>{item.key} {isCur?<Text style={{fontSize:12}}>（当前）</Text>:''}</Text>
                  <Text style={styles.desc}>最新章节：{item.newChapterName || ''}</Text>
                </Touchable>
              )
            })}
          </ScrollView>
        ) : (
          <Loading />
        )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  raItem: {
    height: 60,
    flex: 1
  },
  row: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee'
  },
  name: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5
  },
  desc: {
    fontSize: 12
  }
})
