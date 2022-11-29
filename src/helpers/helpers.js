const { networkInterfaces } = require('os')

const nets = networkInterfaces()

const results = Object.keys(nets).reduce((curr, name) => {
    for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
            curr.push(net.address)
        }
    }
    return curr
}, [])

const localIp = results.length ? results[0] : '127.0.0.1'

const messageTypes = {
    garmin: {
        info: 'garminInfo',
        status: 'garminStatus'
    },
    gsPro: {
        info: 'gsProInfo',
        status: 'gsProStatus',
        shot: 'gsProShot'
    },
    system: {
        ipOptions: 'ipOptions',
        setIp: 'setIp',
        testShot: 'sendTestShot'
    }
}

exports.localIP = localIp
exports.localIPs = results
exports.messageTypes = messageTypes
