import React, { Component } from 'react'
import { StyleSheet, View, Text, Image, ScrollView, FlatList } from 'react-native'
import { connect } from 'react-redux'
import {Icon, SearchBar} from 'antd-mobile'
import {CachedImage} from 'react-native-cached-image'
import { Button, Header, AppFont, Touchable } from '../components'
import { NavigationActions, Storage, createAction, appHeight, appWidth, defaultImg } from '../utils'

@connect(({book, loading}) => ({...book, ...loading}))
export default class extends Component {

  constructor(props) {
    super(props);
    this.state = {
      keyword: '',
      pageType: 'history', // or result
      history: [],
    };
  }

  componentDidMount() {
    Storage.get('searchHistory', []).then( history => {
      if(history.length > 0){
        this.setState({history})
      }
    });
  }

  onFocus = () => {
    this.setState({ pageType:'history' })
  };

  onSubmit = (keyword) => {
    if(keyword.trim()) {
      let {history} = this.state;
      if (history.indexOf(keyword) === -1) {
        history.unshift(keyword)
      }
      this.setState({pageType: 'result', history, keyword});
      Storage.set('searchHistory', history);
      this.props.dispatch(createAction('book/search')({keyword}))
    }
  };

  onClearHistory = () => {
    Storage.remove('searchHistory').then( () => {
      this.setState({history: []})
    })
  };

  onRowClick = (item) => {
    this.props.dispatch(NavigationActions.navigate({routeName: 'Detail', params: item}));
  };

  render() {
    const {keyword, pageType} = this.state;
    return (
      <View style={styles.container}>
        <Header back noRight>
          <SearchBar
            value={keyword}
            placeholder="关键字"
            cancelText="搜索"
            onCancel={this.onSubmit}
            onSubmit={this.onSubmit}
            onFocus={this.onFocus}
            onChange={val => this.setState({keyword:val})}
          />
        </Header>
        {pageType==='result'? this.renderList() : this.renderHistory()}
      </View>
    )
  }

  renderHistory = () => {
    const {history} = this.state;
    return (
      <View>
        <View style={styles.title}>
          <Text>搜索历史：</Text>
          <Touchable onPress={this.onClearHistory}><Icon type={AppFont.del} color="#666" /></Touchable>
        </View>
        <View style={styles.history}>
          {history.map( (item,i) => (
            <Touchable style={styles.item} key={i} onPress={()=>this.onSubmit(item)}>
              <Text>{item}</Text>
            </Touchable>
          ))}
        </View>
      </View>
    )
  };

  renderList = () => {
    const {searchList} = this.props;
    return (
      <FlatList
        data={searchList}
        keyExtractor={(item, i) => `${i}`}
        getItemLayout={(data, index) => ({length: 80, offset: 80 * index, index})}
        renderItem={({item, index})=>(
          <Touchable style={styles.row} onPress={()=>this.onRowClick(item)}>
            <View style={{paddingHorizontal:15}}>
              <CachedImage
                source={{uri: item.img}}
                defaultSource={defaultImg}
                style={{width: 80, height: 105}}
              />
            </View>
            <View style={{flexDirection: 'column', width:appWidth-130}}>
              <View style={styles.name}>
                <Text style={{color:'#000'}}>{item.name}</Text>
                <Text style={{color:'#444'}}>{item.author}</Text>
              </View>
              <Text style={[styles.desc, {marginVertical:8}]}>类型：{item.type}　更新状态：{item.status}</Text>
              <Text style={styles.desc} numberOfLines={3}>简介：{item.desc}</Text>
            </View>
          </Touchable>
        )}
      />
    )
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  title: {
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  history: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
  },
  item: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 5,
    borderWidth: 0.5,
    borderColor: '#ddd'
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd'
  },
  name: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  desc: {
    fontSize: 12,
    color: '#777',
  }
});
