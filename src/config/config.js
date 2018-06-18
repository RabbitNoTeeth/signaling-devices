
// webRtc 配置项
const webRtcConfig = {
    mediaStreamConstrains: {
        audio: true
    },
    signalingServerAddress: '192.168.0.228:9238',
    iceServersConfig: {
        iceServers:[
            { urls:"stun:192.168.0.228:3478" },
            { urls:"turn:192.168.0.228:3478", username:"inesadt", credential:"inesadt" }
        ]
    }
};

// axios配置项
const axiosBaseUrl = "http://localhost:9238";

export {webRtcConfig,axiosBaseUrl};