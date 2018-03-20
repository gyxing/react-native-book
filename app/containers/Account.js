import React, {Component} from 'react';
import {StyleSheet, View, ImageBackground, Image, Text, ScrollView} from 'react-native';
import { connect } from 'react-redux'
import {Modal, WhiteSpace} from 'antd-mobile';
import {Touchable} from '../components'

import {createAction, NavigationActions, appWidth, appHeight, Storage} from '../utils'

@connect(({books}) => ({...books}))
export default class extends Component {

  onClearData = () => {
    Modal.alert('清空书架', '删除书架里的所有书本，包括章节、内容等，是否确定?', [
      {text: '取消'},
      {text: '确定', onPress: () => {
        this.props.dispatch(createAction('book/clear')({}))
      }},
    ]);
  };

  onReset = () => {
    Modal.alert('还原阅读设置', '字体大小、纸张模式等还原到默认模式，是否确定?', [
      {text: '取消'},
      {text: '确定', onPress: () => {
        Storage.remove('readSetup')
      }},
    ]);
  };

  render() {
    return (
      <View style={styles.container}>
        <ImageBackground source={require('../images/dml.png')} style={{height: 100, justifyContent:'center'}}>
          <View style={{paddingLeft:20, flexDirection:'row', alignItems:'center'}}>
            <Image source={require('../images/logo.png')} style={{width:60,height:60}} />
            <Text style={{fontSize:24, color:'#333',marginLeft:15}}>在线小说阅读</Text>
          </View>
        </ImageBackground>
        <View>
          <Text style={{color:'#666',paddingVertical:8, paddingLeft:20}}>设置</Text>
          <IButton label="清除书架" brief="书架列表、已缓存的章节内容等数据" onPress={this.onClearData}/>
          <IButton label="还原阅读设置" brief="字体大小、阅读模式等设置" onPress={this.onReset}/>
          <WhiteSpace/>
          <IButton label="免责声明"/>
        </View>
      </View>
    )
  }
}

class IButton extends Component {
  render() {
    const {label, brief, onPress} = this.props;
    return (
      <Touchable activeOpacity={onPress?0.7:1} onPress={onPress? () => onPress() : null} style={styles.button}>
        <Text style={styles.btnLabel}>{label}</Text>
        {React.isValidElement(brief) ? brief : (
          <Text style={styles.btnBrief}>{brief}</Text>
        )
        }
      </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: appWidth*0.85,
    height: appHeight,
    backgroundColor: '#f3f3f3',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 10
  },
  button: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 45,
    borderBottomColor: '#eee',
    borderBottomWidth: 0.5
  },
  btnLabel: {
    color: '#333',
    marginHorizontal: 20,
  },
  btnBrief: {
    color: '#666',
    fontSize: 12,
  },
  new: {
    backgroundColor: '#f00',
    color: '#fff',
    fontSize: 10,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 6,
  }
});
