<template>
    <div>
        <Button type="success" size="small" icon="android-microphone" v-if="online === 'y' && !showCallView" @click="callBtnClick">呼叫</Button>
        <div v-if="online === 'y' && showCallView">
            <p><audio ref="remoteAudio" autoplay controls></audio></p>
            <p><Button type="error" size="small" icon="android-microphone-off" @click="closeCallBtnClick">断开</Button></p>
        </div>
        <Button type="success" size="small" icon="android-microphone-off" disabled v-if="online === 'n'">呼叫</Button>
    </div>

</template>

<script>
    import SunvuaWebRtcClient from './../assets/webrtc/SunvuaWebRtcClient';
    import {webRtcConfig} from '../config/config';
    export default {
        name: "CallDevice",
        //数据模版
        data() {
            return {
                showCallView: false,
                peerMap: new Map()
            }
        },
        //组件属性
        props: {
            deviceCode: {
                type: String
            },
            online: {
                type: String
            }
        },
        //计算属性
        computed: {

        },
        //组件创建后回调
        created() {

        },
        //组件监听
        watch: {},
        //方法
        methods: {
            /**
             * 呼叫按钮点击
             */
            callBtnClick(){
                let app = this;
                let deviceCode = app.deviceCode;
                app.showCallView = true;
                let peer;
                const config = webRtcConfig,
                    onLocalStream = (localStream) => {},
                    onRemoteStream = (remoteStream) => {
                        app.$refs['remoteAudio'].srcObject = remoteStream
                    },
                    onConnectionStateChange = (state) => {
                        if(state === 'disconnected' || state === 'closed'){
                            app.closeCallBtnClick();
                            // 触发回调，重新加载设备列表
                            app.$emit('reloadDeviceList')
                        }
                        if(state === 'connected'){
                            app.peerMap.set(deviceCode,peer)
                        }
                    };

                peer = new SunvuaWebRtcClient(config,onLocalStream,onRemoteStream,onConnectionStateChange);
                peer.createCaller(deviceCode)

            },

            /**
             * 断开按钮点击
             */
            closeCallBtnClick(){
                let app = this;
                let deviceCode = app.deviceCode;
                if(app.peerMap.has(deviceCode)){
                    app.peerMap.get(deviceCode).close();
                    app.peerMap.delete(deviceCode);
                }
                app.showCallView = false;
            }

        },
        //组件加载完毕执行方法
        mounted: function () {

        },
        //引入组件
        components: {}
    }
</script>

<style scoped>

</style>