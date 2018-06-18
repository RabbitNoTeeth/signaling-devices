
class SunvuaWebRtcClient {

    /**
     *
     * @param config    webRtc配置项，格式如下：
     *              {
     *                  mediaStreamConstrains: {
     *                      audio: true
     *                  },
     *                  signalingServerAddress: '192.168.0.228:9238',
     *                  iceServersConfig: {
     *                      iceServers:[
     *                          { urls:"stun:60.2.127.254:3478" },
     *                          { urls:"turn:60.2.127.254:3478", username:"inesadt", credential:"inesadt" }
     *                      ]
     *                  }
     *              }
     * @param onLocalStream                 // 获取到本地媒体流后的回调
     * @param onRemoteStream                // 接收到远程媒体流后的回调
     * @param onConnectionStateChange       // 对等连接状态变化后的回调
     */
    constructor(config, onLocalStream = (localStream) => {}, onRemoteStream = (remoteStream) => {}, onConnectionStateChange = (state) => {}){
        this.config = config;
        this.onLocalStream = onLocalStream;
        this.onRemoteStream = onRemoteStream;
        this.onConnectionStateChange = onConnectionStateChange;
        this.peer = null;
        this.websocket = null;
    }


    //********************************************* 公有方法区(在使用客户端时只需要调用下面3个方法) **********************************************//

    /**
     * 创建呼叫方
     */
    createCaller(room){
        this.connect(room,() => { this.createOffer(); });
    }

    /**
     * 创建被呼叫方
     */
    createWaiter(room){
        this.connect(room, () => {});
    }

    /**
     * 关闭对等连接
     */
    close(){
        this.peer.close();
    }

    //********************************************* 私有方法区(下面的方法在使用客户端时无需显示调用) **********************************************//

    /**
     * 连接信令服务器
     */
    connect(room,onInitPeerConnectionSuccess){
        this.websocket = new WebSocket(`ws://${this.config.signalingServerAddress}${room}?pc`);
        this.websocket.onopen = () => {
            console.log("信令服务器连接成功");
            this.initLocalMediaStream(onInitPeerConnectionSuccess)
        };
        this.websocket.onmessage = (e) => {
            let signaling = JSON.parse(e.data);
            this.receiveSignaling(signaling)
        };
        this.websocket.onclose = (e) => {
            console.log('信令服务器连接关闭');
        };
        this.websocket.onerror = (e) => {
            console.log('信令服务器连接异常',e);
        };
    }

    /**
     * 初始化本地媒体流
     */
    initLocalMediaStream(onInitPeerConnectionSuccess){
        navigator.mediaDevices.getUserMedia(this.config.mediaStreamConstrains)
            .then(mediaStream => {
                console.log("本地媒体流获取成功");
                this.onLocalStream(mediaStream);
                // 创建对等连接
                this.initPeerConnection(mediaStream);
                onInitPeerConnectionSuccess();
            })
            .catch(error => {
                console.log('本地媒体流获取失败: ', error);
            });
    }

    /**
     * 初始化peer对等连接
     */
    initPeerConnection(mediaStream){
        this.peer = new RTCPeerConnection(this.config.iceServersConfig);
        this.peer.onicecandidate = (e) => {
            if(e.candidate){
                let signaling = {
                    type: 'candidate',
                    id: e.candidate.sdpMid,
                    mlineindex: e.candidate.sdpMLineIndex,
                    candidate: e.candidate.candidate
                };
                this.websocket.send(JSON.stringify(signaling))
            }
        };
        this.peer.onaddstream = (e) => {
            // 回调参数为远程媒体流
            this.onRemoteStream(e.stream)
        };
        this.peer.oniceconnectionstatechange = (e) => {
            // 回调参数为当前连接状态：checking、connected、disconnected、fail中的一种
            const state = e.originalTarget.iceConnectionState;
            if(state === 'disconnected' || state === 'closed'){
                this.websocket.close();
            }
            this.onConnectionStateChange(state)
        };
        this.peer.addStream(mediaStream);
    }

    /**
     * 处理接收到的信令消息
     * @param signaling
     */
    receiveSignaling(signaling){
        if(this.peer){
            switch (signaling.type){
                case "offer":
                    console.log("接收到offer提议信令");
                    this.peer.setRemoteDescription(signaling);
                    this.createAnswer();
                    break;
                case "answer":
                    console.log("接收到answer应答信令");
                    this.peer.setRemoteDescription(signaling);
                    break;
                case "candidate":
                    console.log("接收到candidate信令");
                    this.addIceCandidate(signaling);
                    break;
                default:
                    break;
            }
        }
    }

    /**
     * 创建offer信令
     */
    createOffer(){
        this.peer.createOffer()
            .then(description => {
                console.log("offer提议信令创建成功");
                //设置本地description
                this.setLocalDescription(description)
            })
            .catch(error => {
                console.log("offer提议信令创建失败",error)
            });
    };

    /**
     * 创建answer信令
     */
    createAnswer(){
        this.peer.createAnswer()
            .then(description => {
                console.log("answer应答信令创建成功");
                //设置本地description
                this.setLocalDescription(description)
            })
            .catch(e => {
                console.log("answer应答信令创建失败",e)
            });
    };

    /**
     * 设置本地媒体描述
     */
    setLocalDescription(description){
        this.peer.setLocalDescription(description)
            .then(() => {
                console.log("LocalDescription 设置成功");
                this.websocket.send(JSON.stringify(description));
                console.log("信令发送成功，type=" + description.type)
            })
            .catch(e => {
                console.log("LocalDescription 设置失败", e)
            })
    };

    /**
     * 设置远程媒体描述
     */
    setRemoteDescription(description){
        this.peer.setRemoteDescription(new RTCSessionDescription(description))
            .then(() => {
                console.log("RemoteDescription 设置成功")
            })
            .catch(e => {
                console.log("RemoteDescription 设置失败", e)
            });
    };

    /**
     * 设置 iceCandidate
     */
    addIceCandidate(candidate){
        this.peer.addIceCandidate(new RTCIceCandidate({
            sdpMid: candidate.id,
            sdpMLineIndex: candidate.mlineindex,
            candidate: candidate.candidate
        }))
            .then(() => {
                console.log("iceCandidate 设置成功")
            })
            .catch(e => {
                console.log("iceCandidate 设置失败",e)
            });
    };

}

export default SunvuaWebRtcClient;