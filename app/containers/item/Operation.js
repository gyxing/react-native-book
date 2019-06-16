import React, { Component } from "react";
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Modal,
    Image
} from "react-native";
import { Icon, Toast, Slider } from "antd-mobile-rn";
import { Button, AppFont, Touchable } from "../../components";
import Loading from "../Loading";
import {
    appHeight,
    createAction,
    appWidth,
    NavigationActions,
    Storage
} from "../../utils";

export default class extends Component {

    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            popupMode: ""
        };
    }

    show = () => {
        this.setState({visible: true, popupMode: ""})
    };

    hide = () => {
        this.setState({visible: false, popupMode: ""})
    };

    // openDrawer, onPrevious, onNext, onBack, onNight, onSetup, onGoDetail, onCache, onGoSwitching, onGoWebPage
    onEvent = (key, isHide, value1, value2) => {
        if (this.props[key]) {
            if (isHide) {
                this.hide()
            }
            this.props[key](value1, value2)
        }
    };

    render() {
        const {visible, popupMode} = this.state;
        const {title} = this.props;
        const color = "#082646";
        return (
            <Modal
                visible={visible}
                transparent={true}
                hardwareAccelerated={true}
                animationType="fade"
                onRequestClose={() => this.hide()}
            >
                <Touchable
                    activeOpacity={1}
                    style={styles.modal}
                    onPress={() => this.hide()}
                >
                    <View style={styles.head}>
                        <Text numberOfLines={1} style={{ color: "#333" }}>{title}</Text>
                    </View>
                    <View style={styles.center}>
                        <Touchable
                            style={styles.left}
                            onPress={() => this.onEvent('openDrawer', true)}
                        >
                            <Icon type={AppFont.doubleRight} color="#666"/>
                        </Touchable>
                        <Touchable style={styles.right}>
                            <Text
                                style={[
                                    styles.rightI,
                                    { borderBottomWidth: 0.5, borderBottomColor: "#eee", color }
                                ]}
                                onPress={() => this.onEvent('onPrevious', true)}
                            >
                                上一章
                            </Text>
                            <Text style={[styles.rightI, { color }]} onPress={() => this.onEvent('onNext', true)}>
                                下一章
                            </Text>
                        </Touchable>
                    </View>
                    <View style={styles.foot}>
                        <Touchable
                            style={styles.footI}
                            onPress={() => this.onEvent('onBack', true)}
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
                                this.onEvent('onNight', false)
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
                {this.renderPopup()}
            </Modal>
        )
    }

    renderPopup = () => {
        const { popupMode } = this.state;
        const { fontSize } = this.props;
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
                            onPress={() => this.onEvent("onSetup", false, "fontSize", 18)}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Slider
                            defaultValue={fontSize}
                            min={10}
                            max={40}
                            step={2}
                            onAfterChange={val => this.onEvent("onSetup", false, "fontSize", val)}
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
                    <Touchable onPress={() => this.onEvent("onSetup", false, "paper", "default")}>
                        <Image
                            source={require("../../images/pages/default.png")}
                            style={styles.paper}
                        />
                    </Touchable>
                    <Touchable onPress={() => this.onEvent("onSetup", false, "paper", "paper")}>
                        <Image
                            source={require("../../images/pages/paper.jpg")}
                            style={styles.paper}
                        />
                    </Touchable>
                </View>
            );
        } else if (popupMode === "more") {
            return (
                <View style={[styles.popup, { width: 200, left: appWidth / 2 - 100 }]}>
                    <Touchable style={styles.line} onPress={() => this.onEvent('onGoDetail', true)}>
                        <Icon type={AppFont.info} size={16} color="#444"/>
                        <Text style={styles.lineTxt}>详情</Text>
                    </Touchable>
                    <Touchable style={styles.line} onPress={() => this.onEvent('onCache', true, 50)}>
                        <Icon type={AppFont.download} size={18} color="#444"/>
                        <Text style={styles.lineTxt}>缓存后面50章</Text>
                    </Touchable>
                    <Touchable style={styles.line} onPress={() => this.onEvent('onCache', true, -1)}>
                        <Icon type={AppFont.download} size={18} color="#444"/>
                        <Text style={styles.lineTxt}>缓存剩余章节</Text>
                    </Touchable>
                    <Touchable style={styles.line} onPress={() => this.onEvent('onGoSwitching', true)}>
                        <Icon type={AppFont.change} size={16} color="#444"/>
                        <Text style={styles.lineTxt}>切换下载源</Text>
                    </Touchable>
                    <Touchable style={[styles.line, { borderBottomWidth: 0 }]} onPress={() => this.onEvent('onGoWebPage', true)}>
                        <Icon type={AppFont.ie} size={18} color="#444"/>
                        <Text style={styles.lineTxt}>浏览器打开</Text>
                    </Touchable>
                </View>
            );
        }
    };

}

const styles = StyleSheet.create({
    modal: {
        flex: 1,
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
    popup: {
        backgroundColor: "#fff",
        position: "absolute",
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 10,
        bottom: 80
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
    }
});
