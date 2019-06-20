import React, { Component } from "react";
import { connect } from "react-redux";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { Icon, Toast, Modal, Radio, TextareaItem, List } from "antd-mobile-rn";
import { Header, AppFont, Touchable } from "../components";
import Loading from "./Loading";
import {
    appHeight,
    createAction,
    appWidth,
    NavigationActions,
    Storage,
    originList
} from "../utils";

const RadioItem = Radio.RadioItem;

@connect(({ book, loading }) => ({ ...book, ...loading }))
export default class extends Component {
    constructor(props) {
        super(props);
        let {params} = props.navigation.state;
        this.refreshChapterOne = params.refreshChapterOne;
        this.refreshChapterMore = params.refreshChapterMore;
        this.book = params.book;
        this.ways = [
            {value: 'one', label: '仅当前章节'},
            {value: 'more', label: '剩余章节'},
            {value: 'all', label: '全本'}
        ];
        this.state = {
            dlWay: params.dlWay || "one",
            resourceList: [],
            loadEnded: false,
            visible: false,
            originType: originList[0].key,
            originUrl: ''
        };
    }

    componentDidMount() {
        this.props.dispatch(createAction("book/exchange")({
            book: this.book,
            callback: (data) => {
                if(data.length > 0) {
                    this.setState({ resourceList: data });
                } else {
                    // Toast.fail('缺少资源', 2);
                    this.setState({ loadEnded: true })
                }
            },
            error: () => {
                this.setState({ loadEnded: true })
            }
        }));
    }

    setDlWay = (dlWay) => {
        this.setState({ dlWay });
    };

    onRowClick = (item) => {
        const {dispatch} = this.props;
        Toast.loading("加载中...", 0);
        dispatch(createAction("book/replaceChapters")({
            book: this.book,
            dlWay: this.state.dlWay,
            origin: item,
            ...this.afterCallback()
        }));
    };

    afterCallback = () => {
        const {dispatch} = this.props;
        return {
            callback: () => {
                Toast.hide();
                dispatch(createAction('book/getBooks')());
                dispatch(
                    NavigationActions.reset({
                        index: 0,
                        actions: [NavigationActions.navigate({routeName: 'Home'})],
                    })
                )
            },
            callbackOne: (data) => {
                Toast.hide();
                if(this.refreshChapterOne) {
                    this.refreshChapterOne(data);
                }
                dispatch(NavigationActions.back());
            },
            callbackMore: () => {
                Toast.hide();
                if(this.refreshChapterMore) {
                    this.refreshChapterMore();
                }
                dispatch(NavigationActions.back());
            }
        }
    };

    onAddModal = () => {
        this.setState({ visible: true })
    };

    onRadio = (e, item) => {
        if (e.target.checked) {
            this.setState({ originType: item.key });
        }
    };

    submitExchange = () => {
        const { originType, originUrl } = this.state;
        if (!originType || !originUrl) {
            Modal.alert('请将数据请写完整');
            return false;
        }
        Modal.alert('确定使用此数据源？', '', [
            { text: '再想想' },
            {
                text: '确定使用',
                onPress: () => {
                    this.setState({ visible: false });
                    Toast.loading("加载中...", 0);
                    this.props.dispatch(createAction("book/customizeOrigin")({
                        book: this.book,
                        dlWay: this.state.dlWay,
                        origin: originType,
                        url: originUrl,
                        ...this.afterCallback()
                    }))
                }
            },
        ]);
    };

    render() {
        const { dlWay, resourceList, loadEnded } = this.state;
        return (
            <View style={styles.container}>
                <Header back title="切换下载源"/>
                <View style={styles.center}>
                    {this.ways.map((item,index) => (
                        <Touchable key={index} style={[styles.center, styles.raItem]} onPress={() => this.setDlWay(item.value)}>
                            <Icon type={dlWay === item.value ? AppFont.checkboxOn : AppFont.checkbox}
                                  color={dlWay === item.value ? "#07f" : "#999"}/>
                            <Text> {item.label}</Text>
                        </Touchable>
                    ))}
                </View>
                {resourceList.length > 0 ? (
                    <ScrollView style={{ borderTopColor: "#eee", borderTopWidth: 0.5 }}>
                        {resourceList.map((item, index) => {
                            let isCur = this.book.origin === item.origin;
                            return (
                                <Touchable key={index} style={styles.row} activeOpacity={isCur ? 1 : 0.8}
                                           onPress={isCur ? null : () => this.onRowClick(item)}>
                                    <Text style={styles.name}>{item.key} {isCur ?
                                        <Text style={{ fontSize: 12, color: "#07f" }}>（当前）</Text> : ""}</Text>
                                    <Text style={styles.desc}>最新章节：{item.newChapterName || ""}</Text>
                                </Touchable>
                            );
                        })}
                    </ScrollView>
                ) : (
                    loadEnded ? (
                        <View style={[styles.center, {flex: 1}]}>
                            <Text>缺少资源</Text>
                        </View>
                    ) : (
                        <Loading msg="加载略慢，请耐心等待"/>
                    )
                )}
                {dlWay !== 'one' ? (
                    <Touchable style={[styles.center, styles.footer]} onPress={() => this.onAddModal()}>
                        <Text>手动输入资源链接</Text>
                    </Touchable>
                ) : null}
                {this.renderModal()}
            </View>
        );
    }

    renderModal() {
        const way = this.ways.find(d => d.value === this.state.dlWay);
        return (
            <Modal
                popup
                visible={this.state.visible}
                animationType="slide-up"
                maskClosable={true}
                onClose={() => {
                    this.setState({ visible: false })
                }}
            >
                <ScrollView style={styles.content}>
                    <List renderHeader={'替换章节： ' + way.label} />
                    <List renderHeader={'选择来源网站'}>
                        {originList.map((item, index) => (
                            <RadioItem
                                key={index}
                                checked={this.state.originType === item.key}
                                onChange={(e) => this.onRadio(e, item)}
                            >
                                {item.key}
                            </RadioItem>
                        ))}
                    </List>
                    <List renderHeader={'小说目录所在网址'}>
                        <TextareaItem
                            clear
                            autoHeight
                            value={this.state.originUrl}
                            placeholder="在此输入网址"
                            onChange={ value => this.setState({originUrl: value}) }
                            style={{paddingHorizontal: 16}}
                        />
                    </List>
                </ScrollView>
                <View style={{height: 30}} />
                <Touchable style={[styles.center, styles.footer, {backgroundColor: '#07f'}]} onPress={() => this.submitExchange()}>
                    <Text style={{color: '#fff'}}>切换至该资源</Text>
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row"
    },
    raItem: {
        height: 60,
        flex: 1
    },
    row: {
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "#eee"
    },
    name: {
        fontSize: 16,
        color: "#333",
        marginBottom: 5
    },
    desc: {
        fontSize: 12
    },
    footer: {
        height: 50,
        borderTopWidth: 0.5,
        borderTopColor: "#ddd"
    },
    content: {
        padding: 0
    }
});
