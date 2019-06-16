import React, { Component } from 'react'
import {
    StyleSheet,
    View,
    WebView
} from 'react-native'
import Loading from "./Loading";
import { Header } from "../components";

export default class extends Component {

    constructor(props) {
        super(props);
        const { params } = props.navigation.state;
        this.webTitle = params.title || '';
        this.webUrl = params.url;
    }

    render() {
        console.log(this.webUrl);
        return (
            <View style={styles.container}>
                <Header back title={this.webTitle}/>
                <WebView
                    source={{uri: this.webUrl}}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => <Loading />}
                    style={{flex: 1}}
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",

    }
});
