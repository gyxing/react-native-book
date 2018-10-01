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
    DrawerLayoutAndroid
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
            modalVisible: false,
            popupMode: "",

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
                modalVisible: false,
                popupMode: ""
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
                                modalVisible: false,
                                popupMode: ""
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
                            // Toast.fail('缺少资源: ' + JSON.stringify(chapter))
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
        this.setState({ modalVisible: false, popupMode: "" });
        this.props.dispatch(
            NavigationActions.navigate({
                routeName: "Detail",
                params: this.state.book
            })
        );
    };

    onGoSwitching = () => {
        this.setState({ modalVisible: false, popupMode: "" });
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
        this.setState({ modalVisible: false, popupMode: "" });
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
                {this.renderPopup()}
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
                        onPress={() => this.setState({ modalVisible: true })}
                    >
                        <Loading/>
                    </Touchable>
                ) : (
                    <ScrollView style={{ flex: 1 }} ref={ref => (this._scrollView = ref)}>
                        <Touchable
                            activeOpacity={1}
                            style={{ flex: 1 }}
                            onPress={() => this.setState({ modalVisible: true })}
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
        const { modalVisible, book, chapter, popupMode, night } = this.state;
        const color = "#082646";
        return modalVisible ? (
            <Touchable
                activeOpacity={1}
                style={styles.modal}
                onPress={() => this.setState({ modalVisible: false, popupMode: "" })}
            >
                <View style={styles.head}>
                    <Text numberOfLines={1} style={{ color: "#333" }}>
                        {book.name} {chapter.name}
                    </Text>
                </View>
                <View style={styles.center}>
                    <Touchable
                        style={styles.left}
                        onPress={() => this.drawer.openDrawer()}
                    >
                        <Icon type={AppFont.doubleRight} color="#666"/>
                    </Touchable>
                    <Touchable style={styles.right}>
                        <Text
                            style={[
                                styles.rightI,
                                { borderBottomWidth: 0.5, borderBottomColor: "#eee", color }
                            ]}
                            onPress={this.onPrevious}
                        >
                            上一章
                        </Text>
                        <Text style={[styles.rightI, { color }]} onPress={this.onNext}>
                            下一章
                        </Text>
                    </Touchable>
                </View>
                <View style={styles.foot}>
                    <Touchable
                        style={styles.footI}
                        onPress={() => this.props.dispatch(NavigationActions.back())}
                    >
                        <Icon type={AppFont.left} size={23} color={color}/>
                    </Touchable>
                    <Touchable
                        style={styles.footI}
                        onPress={() =>
                            this.setState({ popupMode: popupMode === "font" ? "" : "font" })
                        }
                    >
                        <Icon type={AppFont.font} size={23} color={color}/>
                    </Touchable>
                    <Touchable
                        style={styles.footI}
                        onPress={() =>
                            this.setState({ popupMode: popupMode === "paper" ? "" : "paper" })
                        }
                    >
                        <Icon type={AppFont.light} size={28} color={color}/>
                    </Touchable>
                    <Touchable
                        style={styles.footI}
                        onPress={() => {
                            this.setState({ popupMode: "" });
                            this.onSetup("night", !night);
                        }}
                    >
                        <Icon type={AppFont.moon} size={20} color={color}/>
                    </Touchable>
                    <Touchable
                        style={styles.footI}
                        onPress={() =>
                            this.setState({ popupMode: popupMode === "more" ? "" : "more" })
                        }
                    >
                        <Icon type={AppFont.more} size={26} color={color}/>
                    </Touchable>
                </View>
            </Touchable>
        ) : null;
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
    };

    renderPopup = () => {
        const { popupMode, fontSize, paper } = this.state;
        if (popupMode === "font") {
            return (
                <View style={[styles.popup, { width: 240, left: appWidth / 2 - 120 }]}>
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            height: 30,
                            paddingHorizontal: 8
                        }}
                    >
                        <Text>字体：{fontSize}</Text>
                        <Button
                            title=""
                            text="默认"
                            textStyle={{ fontSize: 10 }}
                            style={{ paddingHorizontal: 5, paddingVertical: 3 }}
                            onPress={() => this.onSetup("fontSize", 18)}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Slider
                            defaultValue={fontSize}
                            min={10}
                            max={40}
                            step={2}
                            onAfterChange={val => this.onSetup("fontSize", val)}
                        />
                    </View>
                </View>
            );
        } else if (popupMode === "paper") {
            return (
                <View
                    style={[
                        styles.popup,
                        {
                            width: 180,
                            left: appWidth / 2 - 90,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            paddingHorizontal: 20
                        }
                    ]}
                >
                    <Touchable onPress={() => this.onSetup("paper", "default")}>
                        <Image
                            source={require("../images/pages/default.png")}
                            style={styles.paper}
                        />
                    </Touchable>
                    <Touchable onPress={() => this.onSetup("paper", "paper")}>
                        <Image
                            source={require("../images/pages/paper.jpg")}
                            style={styles.paper}
                        />
                    </Touchable>
                </View>
            );
        } else if (popupMode === "more") {
            return (
                <View style={[styles.popup, { width: 200, left: appWidth / 2 - 100 }]}>
                    <Touchable style={styles.line} onPress={this.onGoDetail}>
                        <Icon type={AppFont.info} size={16} color="#444"/>
                        <Text style={styles.lineTxt}>详情</Text>
                    </Touchable>
                    <Touchable style={styles.line} onPress={() => this.onCache(50)}>
                        <Icon type={AppFont.download} size={18} color="#444"/>
                        <Text style={styles.lineTxt}>缓存后面50章</Text>
                    </Touchable>
                    <Touchable style={styles.line} onPress={() => this.onCache(-1)}>
                        <Icon type={AppFont.download} size={18} color="#444"/>
                        <Text style={styles.lineTxt}>缓存剩余章节</Text>
                    </Touchable>
                    <Touchable
                        style={[styles.line, { borderBottomWidth: 0 }]}
                        onPress={this.onGoSwitching}
                    >
                        <Icon type={AppFont.change} size={16} color="#444"/>
                        <Text style={styles.lineTxt}>切换下载源</Text>
                    </Touchable>
                </View>
            );
        }
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#eee"
    },
    modal: {
        position: "absolute",
        top: 0,
        left: 0,
        width: appWidth,
        height: appHeight - 25,
        justifyContent: "space-between"
    },
    head: {
        justifyContent: "center",
        alignItems: "center",
        height: 50,
        backgroundColor: "#fff"
    },
    center: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    left: {
        backgroundColor: "#fff",
        paddingHorizontal: 15,
        paddingVertical: 20
    },
    right: {
        backgroundColor: "#fff"
    },
    rightI: {
        paddingHorizontal: 15,
        paddingVertical: 20
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
    foot: {
        flexDirection: "row",
        height: 60,
        backgroundColor: "#fff"
    },
    footI: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
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
    popup: {
        backgroundColor: "#fff",
        position: "absolute",
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 10,
        bottom: 80
    },
    def: {
        borderWidth: 0.5,
        borderColor: "#bbb",
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 3
    },
    paper: {
        width: 60,
        height: 40
    },
    line: {
        flexDirection: "row",
        alignItems: "center",
        height: 40,
        borderBottomColor: "#eee",
        borderBottomWidth: 0.5,
        paddingHorizontal: 20
    },
    lineTxt: {
        color: "#444",
        marginLeft: 10
    },
    tag: {
        backgroundColor: "#fff",
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRightColor: "#ddd",
        borderRightWidth: 0.5
    }
});
