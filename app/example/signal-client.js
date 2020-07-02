/**
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

const websocket = new WebSocket('ws://localhost:3903', {
  perMessageDeflate: false
})

websocket.on('open', () => {
  websocket.send(JSON.stringify(['ident']))

  websocket.on('message', (message) => {
    try {
      const arr = JSON.parse(message)
      let identPeer = ''
      switch (arr[0]) {
        case 'ident':
          ident = arr[1]
          websocket.send(JSON.stringify(['join', ident, 'iroha']))
          websocket.send(JSON.stringify(['join', ident + '_0', 'iroha']))
          websocket.send(JSON.stringify(['join', ident + '_1', 'iroha']))
          websocket.send(JSON.stringify(['join', ident + '_2', 'iroha']))
          websocket.send(JSON.stringify(['join', ident + '_3', 'iroha']))
          break
        case 'join':
          console.log(arr)
          break
        case 'stun':
          identPeer = arr[1] + ':' + arr[2]
          console.log(identPeer, peers.has(identPeer))
          if (!peers.has(identPeer)) {
            peers.set(identPeer, new Peer({
              config: { iceServers: [{ urls: STUN_SERVER }] },
              initiator: !!arr[3],
              wrtc: wrtc
            }))

            // p2p connection
            peers.get(identPeer).on('connect', () => {
              // wait for 'connect' event before using the data channel
              peers.get(identPeer).send('hey ' + arr[2] + ', how is it going? Greetings, ' + arr[1])
            })
            peers.get(identPeer).on('data', (data) => {
              console.log('got data: ' + data)
            })
            peers.get(identPeer).on('close', () => {
              console.log('closed: ' + ident)
            })

            // error handling
            peers.get(identPeer).on('error', (errorPeer) => {
              console.log('ERROR', errorPeer)
            })

            // this is incoming from STUN/TURN
            peers.get(identPeer).on('signal', (data) => {
              websocket.send(JSON.stringify(['signal', arr[1], arr[2], data]))
            })
          }
          break
        case 'signal':
          identPeer = arr[1] + ':' + arr[2]
          try {
            peers.get(identPeer).signal(arr[3])
          } catch (error) {
            console.log(error)
          }
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
