/*!
 * Example Signal Server client
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import Peer from 'simple-peer'
import wrtc from 'wrtc'
import WebSocket from 'ws'

const STUN_SERVER = 'stun:kopanyo.com:3478'

let ident = ''
const peers = new Map()

const websocket = new WebSocket('ws://localhost:3913', {
  perMessageDeflate: false
})

websocket.on('open', () => {
  websocket.send(JSON.stringify(['ident']))

  websocket.on('message', (message) => {
    let peer = null
    let arr = []
    try {
      arr = JSON.parse(message)
      switch (arr[0]) {
        case 'ident':
          ident = arr[1]
          websocket.send(JSON.stringify(['join', ident, 'iroha']))
          break
        case 'join':
          break
        case 'stun':
          peer = new Peer({
            config: { iceServers: [{ urls: STUN_SERVER }] },
            initiator: !!arr[3],
            wrtc: wrtc
          })

          // p2p connection
          peer.on('connect', () => {
            // wait for 'connect' event before using the data channel
            peer.send('hey ' + arr[2] + ', how is it going? Greetings, ' + arr[1])
          })
          peer.on('data', (data) => {
            // got a data channel message
            console.log('got data: ' + data)
          })
          peer.on('close', () => {
            console.log('closed: ' + ident)
          })

          // error handling
          peer.on('error', (error) => {
            console.log('ERROR', error)
          })

          // this is incoming from STUN/TURN
          peer.on('signal', (data) => {
            websocket.send(JSON.stringify(['signal', arr[1], arr[2], data]))
          })

          peers.set(arr[2], peer)
          break
        case 'signal':
          peers.get(arr[2]).signal(arr[3])
          break
      }
    } catch (error) {
      console.log(error)
      process.exit(1)
    }
  })
})

websocket.on('close', () => {
  peers.forEach((p, k) => {
    p.destroy()
    peers.delete(k)
  })
  process.exit(0)
})

process.on('SIGTERM', () => {
  websocket.close(1000, 'ByeBye')
}).on('SIGINT', () => {
  websocket.close(1000, 'ByeBye')
})
