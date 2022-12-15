const net = require('net')
const ENV = require('./env')
const { messageTypes } = require('./helpers/helpers')

const TIMEOUT_MS = 5000

class GsProConnect {
    constructor(ipcPort) {
        this.deviceID = ENV.DEVICE_ID
        this.units = ENV.UNITS
        this.apiVersion = ENV.API_VERSION
        this.sendClubData = ENV.CLUB_DATA

        this.shotNumber = 1
        this.socket = null
        this.ipcPort = ipcPort

        this.connectSocket()
    }

    connectSocket() {
        this.ipcPort.postMessage({
            type: messageTypes.gsPro.status,
            status: 'connecting',
        })
        this.ipcPort.postMessage({
            type: messageTypes.gsPro.info,
            message: 'Trying to connect to GSPro...',
        })

        this.socket = net.createConnection({
            address: ENV.IP_ADDRESS,
            port: ENV.PORT,
        })
        this.socket.setTimeout(5000)

        this.socket.on('timeout', () => {
            this.ipcPort.postMessage({
                type: messageTypes.gsPro.info,
                message: "Can't connect to GSPro.  Trying again...",
            })
            this.socket.destroy()
            this.connectSocket()
        })

        this.socket.on('connect', () => this.handleConnection())

        this.socket.on('error', (e) => {
            if (e.code === 'ECONNREFUSED') {
                this.ipcPort.postMessage({
                    type: messageTypes.garmin.info,
                    message:
                        'Connection refused.  Do you have the GSPro Connect window open?  Retrying...',
                })
                setTimeout(() => {
                    this.connectSocket()
                }, TIMEOUT_MS)
            } else {
                console.log('error with gspro socket', e)
                this.handleDisconnect()
                this.ipcPort.postMessage({
                    type: messageTypes.gsPro.info,
                    message: 'Error with GSPro connection.  Trying to reconnect...',
                })
                setTimeout(() => {
                    console.log('reconnecting')
                    this.connectSocket()
                }, TIMEOUT_MS)
            }
        })
    }

    handleDisconnect() {
        if (this.socket) {
            this.socket.destroy()

            this.socket = null
            this.ipcPort.postMessage({
                type: messageTypes.gsPro.status,
                status: 'disconnected',
            })
            this.ipcPort.postMessage({
                type: messageTypes.gsPro.info,
                message: 'Disconnected from GSPro...',
                level: 'error',
            })
            this.ipcPort.postMessage({
                type: messageTypes.gsPro.shot,
                ready: false,
            })
        }
    }

    handleConnection() {
        this.ipcPort.postMessage({
            type: messageTypes.gsPro.status,
            status: 'connected',
        })
        this.ipcPort.postMessage({
            type: messageTypes.gsPro.info,
            message: 'Connected to GSPro',
            level: 'success',
        })

        this.socket.setEncoding('UTF8')
        this.socket.setTimeout(0)

        this.socket.on('close', (hadError) => {
            console.log('gsPro connection closed.  Had error: ', hadError)
            if (!hadError) {
                this.handleDisconnect()
                setTimeout(() => this.connectSocket(), TIMEOUT_MS)
            }
        })

        this.socket.on('data', (data) => {
            console.log('incoming message from gsPro:', data);
        })
    }

    launchBall(ballData, clubData) {
        const APIData = {
            DeviceID: this.deviceID,
            Units: this.unit,
            ShotNumber: this.shotNumber,
            APIversion: this.apiVersion,
            BallData: {
                Speed: ballData.ballSpeed,
                SpinAxis: ballData.spinAxis,
                TotalSpin: ballData.totalSpin,
                HLA: ballData.hla,
                VLA: ballData.vla,
            },
            ShotDataOptions: {
                ContainsBallData: true,
                ContainsClubData: false,
            },
        }

        if (this.sendClubData) {
            APIData.ShotDataOptions.ContainsClubData = true

            APIData.ClubData = {
                Speed: clubData.speed,
                AngleOfAttack: clubData.angleofattack,
                FaceToTarget: clubData.facetotarget,
                Lie: clubData.lie,
                Loft: clubData.loft,
                Path: clubData.path,
                SpeedAtImpact: clubData.speedatimpact,
                VerticalFaceImpact: clubData.verticalfaceimpact,
                HorizontalFaceImpact: clubData.horizontalfaceimpact,
                ClosureRate: clubData.closurerate,
            }
        }

        this.socket.write(JSON.stringify(APIData))

        this.shotNumber++
    }
}

module.exports = GsProConnect
