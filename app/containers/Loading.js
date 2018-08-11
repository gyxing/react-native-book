import React from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";

const Loading = (props) => (
    <View style={styles.container}>
        <ActivityIndicator size="large"/>
        {props.msg? (
            <View style={styles.msg}><Text>{props.msg}</Text></View>
        ) : null}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    msg: {
        marginVertical: 10
    }
});

export default Loading;
