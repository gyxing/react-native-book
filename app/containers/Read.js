import React, { Component } from "react";
import { connect } from "react-redux";
import {
    StyleSheet,
    View,
    Text,
    ImageBackground,
    Image,
    ScrollView,
    FlatList,
    DrawerLayoutAndroid,
    Linking
} from "react-native";
import { Icon, Toast, Slider, Modal } from "antd-mobile-rn";
import { Button, AppFont, Touchable } from "../components";
import Loading from "./Loading";
import {
    appHeight,
    createAction,
    appWidth,
    NavigationActions,
    Storage
} from "../utils";
import Operation from './item/Operation';

@connect(({ book, loading }) => ({ ...book, ...loading }))
export default class extends Component {
    constructor(props) {
        super(props);
        const { params } = props.navigation.state;
        this.bookId = params.id;
        this.state = {
            book: {},
            chapter: {},
            chapterList: [],

            fontSize: 18,
            paper: "paper",
            night: false
        };
    }

    componentWillUnmount() {
        Toast.hide();
    }

    componentDidMount() {
        this.initFetchData();
        Storage.get("readSetup", {
            fontSize: 18,
            paper: "paper",
            night: false
        }).then(setup => {
            this.setState({ ...setup });
        });
    }

    initFetchData = () => {
        this.props.dispatch(
            createAction("book/getBook")({
                id: this.bookId,
                callback: book => {
                    this.props.dispatch(
                        createAction("book/getChapters")({
                            bookId: this.bookId,
                            callback: chapterList => {
                                let chapter = chapterList[0];
                                if (book.curChapterId) {
                                    chapter = chapterList.find(
                                        item => item.id === book.curChapterId
                                    );
                                }

                                this.setChapter(chapter, book, chapterList);
                            }
                        })
                    );
                }
            })
        );
    };

    setChapter = (chapter, book, chapterList) => {
        if (!book) {
            book = this.state.book;
        }
        if (!chapterList) {
            chapterList = this.state.chapterList;
        }

        if (chapter.content) {
            this.setState({
                book,
                chapter,
                chapterList,
            });
            this.scrollToTop();
            this.drawer.closeDrawer();
            // 自动缓存后5章
            this.onCache(5);
        } else {
            Toast.loading("正在下载内容...", 0);
            this.props.dispatch(
                createAction("book/searchContent")({
                    chapter,
                    callback: content => {
                        Toast.hide();
                        if(content) {
                            chapter.content = content;
                            chapterList.find(item => item.id === chapter.id).content = content;
                            this.setState({
                                book,
                                chapter,
                                chapterList,
                            });
                            this.scrollToTop();
                            this.drawer.closeDrawer();
                            // 自动缓存后5章
                            this.onCache(5);
                        } else {
                            this.setState({
                                book,
                                chapter,
                                chapterList
                            });
                            Modal.alert('缺少资源', JSON.stringify(chapter, null, 2))
                        }
                    }
                })
            );
        }
        if (book.curChapterId !== chapter.id) {
            this.props.dispatch(
                createAction("book/updateBook")({
                    book,
                    params: {
                        curChapterId: chapter.id,
                        progress: `${(
                            (chapterList.findIndex(item => item.id === chapter.id) + 1) /
                            chapterList.length *
                            100
                        ).toFixed(2)}%`
                    }
                })
            );
            book.curChapterId = chapter.id;
            this.setState({book});
        }
    };

    onPrevious = () => {
        const { chapter, chapterList } = this.state;
        const index = chapterList.findIndex(item => item.id === chapter.id);
        if (chapterList[index - 1]) {
            this.setChapter(chapterList[index - 1]);
        }
    };

    onNext = () => {
        const { chapter, chapterList } = this.state;
        const index = chapterList.findIndex(item => item.id === chapter.id);
        if (chapterList[index + 1]) {
            this.setChapter(chapterList[index + 1]);
        }
    };

    /* ScrollView */
    scrollToTop = () => {
        this._scrollView.scrollTo({ x: 0, y: 0, animated: false });
    };

    /* FlatList */
    scrollTo = index => {
        this._listView.scrollToIndex({ animated: true, index });
    };

    onChapterClick = chapter => {
        this.setChapter(chapter);
    };

    onSetup = (key, val) => {
        this.setState({ [key]: val });
        // 记录
        Storage.get("readSetup", {}).then(setup => {
            setup[key] = val;
            Storage.set("readSetup", setup);
        });
    };

    onGoDetail = () => {
        this.props.dispatch(
            NavigationActions.navigate({
                routeName: "Detail",
                params: this.state.book
            })
        );
    };

    onGoSwitching = () => {
        this.props.dispatch(
            NavigationActions.navigate({
                routeName: "Switching",
                params: {
                    book: this.state.book,
                    refreshChapterOne: (chapter) => {
                        this.setState({ chapter });
                    },
                    refreshChapterMore: () => {
                        this.initFetchData()
                    }
                }
            })
        );
    };

    onCache = len => {
        const { chapter, chapterList } = this.state;
        const index = chapterList.findIndex(item => item.id === chapter.id);
        if (len === -1) {
            len = chapterList.length - index - 1;
        }
        this._cacheChapter(index, len, 1);
    };

    _cacheChapter = (index, len, count) => {
        const { chapterList } = this.state;
        if (count <= len) {
            const chp = chapterList[index + count];
            if (chp && !chp.content) {
                this.props.dispatch(
                    createAction("book/searchContent")({
                        chapter: chp,
                        callback: content => {
                            chapterList[index + count].content = content;
                            this.setState({ chapterList });
                            this._cacheChapter(index, len, count + 1);
                        }
                    })
                );
            } else {
                this._cacheChapter(index, len, count + 1);
            }
        }
    };

    onDrawerSlide = e => {
        if (e === "Idle") {
            const { chapter, chapterList } = this.state;
            const index = chapterList.findIndex(item => item.id === chapter.id);
            this.scrollTo(index > 5 ? index - 5 : 0);
        }
    };

    onToWebPage = () => {
        const url = this.state.chapter.url;
        Linking.canOpenURL(url).then(supported => {
            if (!supported) {
                Toast.fail('此链接打不开');
            } else {
                return Linking.openURL(url);
            }
        }).catch(err => Toast.fail('An error occurred：' + url));
    };

    showOperate = () => {
        this.operate.show()
    };

    render() {
        return (
            <DrawerLayoutAndroid
                ref={ref => (this.drawer = ref)}
                drawerWidth={appWidth - 60}
                keyboardDismissMode="on-drag"
                renderNavigationView={() => this.renderChapterList()}
                onDrawerStateChanged={this.onDrawerSlide}
            >
                {this.renderContent()}
                {this.renderModal()}
            </DrawerLayoutAndroid>
        );
    }

    renderContent = () => {
        const { chapter, fontSize, paper, night, chapterList } = this.state;
        let imgSource = null,
            color = "#333";
        if (night) {
            imgSource = require("../images/pages/black.png");
            color = "#949494";
        } else if (paper === "paper") {
            imgSource = require("../images/pages/paper.jpg");
        } else {
            imgSource = require("../images/pages/default.png");
        }
        return (
            <ImageBackground
                source={imgSource}
                style={{ width: appWidth, height: "100%" }}
            >
                {!chapter.content ? (
                    <Touchable
                        activeOpacity={1}
                        style={{ flex: 1 }}
                        onPress={() => this.showOperate()}
                    >
                        <Loading/>
                    </Touchable>
                ) : (
                    <ScrollView style={{ flex: 1 }} ref={ref => (this._scrollView = ref)}>
                        <Touchable
                            activeOpacity={1}
                            style={{ flex: 1 }}
                            onPress={() => this.showOperate()}
                        >
                            <Text style={[styles.name, { fontSize: fontSize + 2, color }]}>
                                {chapter.name}
                            </Text>
                            <Text style={[styles.content, { fontSize, color }]}>
                                {chapter.content}
                            </Text>
                        </Touchable>
                        <Touchable
                            style={{
                                justifyContent: "center",
                                alignItems: "center",
                                height: 60,
                                borderTopColor: "#eee",
                                borderTopWidth: 0.5
                            }}
                            onPress={this.onNext}
                        >
                            <Text style={{ color }}>下一章节</Text>
                        </Touchable>
                    </ScrollView>
                )}
            </ImageBackground>
        );
    };

    renderModal = () => {
        const { book, chapter, night, fontSize, paper } = this.state;
        return (
            <Operation
                ref={r => this.operate = r}
                title={book.name + ' ' + chapter.name}
                fontSize={fontSize}
                paper={paper}
                onBack={() => this.props.dispatch(NavigationActions.back())}
                openDrawer={() => this.drawer.openDrawer()}
                onPrevious={() => this.onPrevious()}
                onNext={() => this.onNext()}
                onNight={() => this.onSetup("night", !night)}
                onSetup={(k, v) => this.onSetup(k, v)}
                onGoDetail={() => this.onGoDetail()}
                onCache={(v) => this.onCache(v)}
                onGoSwitching={() => this.onGoSwitching()}
                onGoWebPage={() => this.onToWebPage()}
            />
        )
    };

    renderChapterList = () => {
        const { chapterList, chapter } = this.state;
        return (
            <View
                style={{ flex: 1, backgroundColor: "#efefef", paddingHorizontal: 20 }}
            >
                <View
                    style={{
                        height: 50,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}
                >
                    <View>
                        <Text style={{ color: "#07f", fontSize: 16 }}>
                            章节列表（{chapterList.length}）
                        </Text>
                    </View>
                    <View style={{ flexDirection: "row" }}>
                        <Touchable style={styles.tag} onPress={() => this.scrollTo(0)}>
                            <Icon type={AppFont.up} size={16} color="#333"/>
                        </Touchable>
                        <Touchable
                            style={[styles.tag, { borderRightWidth: 0 }]}
                            onPress={() => this.scrollTo(chapterList.length - 1)}
                        >
                            <Icon type={AppFont.down} size={16} color="#333"/>
                        </Touchable>
                    </View>
                </View>
                <View>
                    <FlatList
                        ref={ref => (this._listView = ref)}
                        data={chapterList}
                        keyExtractor={(item, i) => `${i}`}
                        getItemLayout={(data, index) => ({
                            length: 40,
                            offset: 40 * index,
                            index
                        })}
                        style={{ backgroundColor: "#fff", height: appHeight - 90 }}
                        renderItem={({ item, index }) => (
                            <Touchable
                                style={styles.item}
                                onPress={() => this.onChapterClick(item)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={item.id === chapter.id ? { color: "#07f" } : {}}>
                                        {item.name}
                                    </Text>
                                </View>
                                <View style={{ width: 35, alignItems: "flex-end" }}>
                                    {item.content ? (
                                        <Text style={styles.cache}>已缓存</Text>
                                    ) : (
                                        <Text/>
                                    )}
                                </View>
                            </Touchable>
                        )}
                    />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#eee"
    },
    cache: {
        fontSize: 10,
        color: "#fff",
        backgroundColor: "#dd6041",
        paddingVertical: 3,
        textAlign: "center",
        width: "100%"
    },
    item: {
        paddingLeft: 15,
        paddingRight: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: "#ddd",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: 40
    },
    name: {
        textAlign: "center",
        marginTop: 20,
        fontWeight: "600"
    },
    content: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        lineHeight: 35
    },
    tag: {
        backgroundColor: "#fff",
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRightColor: "#ddd",
        borderRightWidth: 0.5
    }
});
