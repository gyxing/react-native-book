import React, { Component } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native'
import { connect } from 'react-redux'
import { Modal, List, Radio, TextareaItem } from 'antd-mobile-rn'
import { Touchable, Header } from '../components'

import {
  NavigationActions,
  Storage
} from "../utils";

const RadioItem = Radio.RadioItem;

@connect()
export default class extends Component {

  constructor(props) {
    super(props);
    this.state = {
      proxy: '',
      list: [],
      visible: false,
      newProxy: '',
      curProxy: ''
    };
  }

  componentWillMount() {
    Storage.get("proxySetup", {
      list: [],
      proxy: ''
    }).then(ret => {
      let { list = [], proxy = '' } = ret;
      if (list.length === 0) {
        list = [
          {key: '', label: '不使用'},
          // {key: 'http://api.gyxing.vip'}
        ];
        ret.list = list;
        Storage.set("proxySetup", ret);
      }
      this.setState({list, proxy, curProxy: proxy})
    });
  }

  onRadio = (item) => {
    this.setState({curProxy: item.key})
  };

  onAdd = () => {
    this.setState({ visible: true })
  };

  onAddSubmit = () => {
    let {newProxy, list} = this.state;
    if (!newProxy.trim()) {
      Modal.alert('请填写代理服务器地址');
      return false;
    }
    const old = list.find(d => d.key === newProxy);
    if (old) {
      Modal.alert('已存在，无需再次添加');
      return false;
    }
    list.push({key: newProxy});
    Storage.get("proxySetup", { list: [], proxy: '' }).then(ret => {
      ret.list = list;
      Storage.set("proxySetup", ret);
      this.setState({list, visible: false, newProxy: ''})
    });
  };

  onRemove = () => {
    let {list, proxy, curProxy} = this.state;
    if (!curProxy) {
      return false;
    }
    if (curProxy && curProxy === proxy) {
      proxy = '';
    }
    list = list.filter(d => d.key !== curProxy);
    Storage.set("proxySetup", {list, proxy});
    this.setState({list, proxy, curProxy: ''})
  };

  onSave = () => {
    let {list, proxy, curProxy} = this.state;
    if (curProxy !== proxy) {
      Storage.set("proxySetup", {list, proxy: curProxy});
    }
    this.props.dispatch(NavigationActions.back());
  };

  render() {
    const {list, curProxy} = this.state;
    return (
      <View style={styles.container}>
        <Header back title="设置代理" />
        <ScrollView style={styles.center}>
          <List renderHeader="选择代理方式">
            {list.map((item,index) => (
              <RadioItem
                key={index}
                checked={curProxy === item.key}
                onChange={() => this.onRadio(item)}
              >{item.label || item.key}</RadioItem>
            ))}
          </List>
        </ScrollView>
        <View style={styles.footer}>
          <Touchable style={[styles.fi, styles.hr]} onPress={() => this.onRemove()}>
            <Text>删除</Text>
          </Touchable>
          <Touchable style={[styles.fi, styles.hr]} onPress={() => this.onAdd()}>
            <Text>添加新代理</Text>
          </Touchable>
          <Touchable style={[styles.fi, styles.strong]} onPress={() => this.onSave()}>
            <Text style={{color: '#0d2e92', fontSize: 18}}>保存</Text>
          </Touchable>
        </View>
        {this.renderModal()}
      </View>
    )
  }

  renderModal = () => {
    const {newProxy, visible} = this.state;
    return (
      <Modal
        title="添加新代理"
        popup
        visible={visible}
        animationType="slide-up"
        maskClosable={true}
        onClose={() => {
          this.setState({ visible: false })
        }}
      >
        <ScrollView>
          <View style={[styles.fi, {height: 50}]}>
            <Text style={{color: '#333', fontSize: 16}}>添加新代理</Text>
          </View>
          <List renderHeader={'代理服务器地址'}>
            <TextareaItem
              clear
              autoHeight
              value={newProxy}
              placeholder="在此输入网址"
              onChange={ value => this.setState({newProxy: value}) }
              style={{paddingHorizontal: 18}}
            />
          </List>
        </ScrollView>
        <View style={{height: 35}} />
        <Touchable style={[styles.fi, {backgroundColor: '#07f', height: 55}]} onPress={() => this.onAddSubmit()}>
          <Text style={{color: '#fff'}}>确定保存</Text>
        </Touchable>
      </Modal>
    )
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  center: {
    flex: 1
  },
  footer: {
    height: 55,
    flexDirection: 'row',
    borderTopColor: '#e2e2e2',
    borderTopWidth: 0.5,
  },
  fi: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hr: {
    borderRightColor: '#e2e2e2',
    borderRightWidth: 0.5,
    flex: 0.5
  },
  strong: {
    backgroundColor: '#e0ebff',
    flex: 1
  }
})
