import React, { Component } from "react";
import { connect } from "react-redux";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { Icon, Toast } from "antd-mobile-rn";
import { Header, AppFont, Touchable } from "../components";
import Loading from "./Loading";
import {
    appHeight,
    createAction,
    appWidth,
    NavigationActions,
    Storage
} from "../utils";

@connect(({ book, loading }) => ({ ...book, ...loading }))
export default class extends Component {
    constructor(props) {
        super(props);
        let {params} = props.navigation.state;
        this.refreshChapterOne = params.refreshChapterOne;
        this.refreshChapterMore = params.refreshChapterMore;
        this.book = params.book;
        this.state = {
            dlWay: params.dlWay || "one",
            resourceList: []
        };
    }

    componentDidMount() {
        this.props.dispatch(createAction("book/exchange")({
            book: this.book,
            callback: (data) => {
                this.setState({ resourceList: data });
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
        }));
    };

    render() {
        const { dlWay, resourceList } = this.state;
        return (
            <View style={styles.container}>
                <Header back title="切换下载源"/>
                <View style={styles.center}>
                    <Touchable style={[styles.center, styles.raItem]} onPress={() => this.setDlWay("one")}>
                        <Icon type={dlWay === "one" ? AppFont.checkboxOn : AppFont.checkbox}
                              color={dlWay === "one" ? "#07f" : "#999"}/>
                        <Text> 仅当前章节</Text>
                    </Touchable>
                    <Touchable style={[styles.center, styles.raItem]} onPress={() => this.setDlWay("more")}>
                        <Icon type={dlWay === "more" ? AppFont.checkboxOn : AppFont.checkbox}
                              color={dlWay === "more" ? "#07f" : "#999"}/>
                        <Text> 剩余章节</Text>
                    </Touchable>
                    <Touchable style={[styles.center, styles.raItem]} onPress={() => this.setDlWay("all")}>
                        <Icon type={dlWay === "all" ? AppFont.checkboxOn : AppFont.checkbox}
                              color={dlWay === "all" ? "#07f" : "#999"}/>
                        <Text> 全本</Text>
                    </Touchable>
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
                    <Loading msg="加载略慢，清耐心等待"/>
                )}
            </View>
        );
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
    }
});
