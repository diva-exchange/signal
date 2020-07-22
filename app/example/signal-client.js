/**
 * Copyright (C) 2020 diva.exchange
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Author/Maintainer: Konrad Bächler <konrad@diva.exchange>
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
              console.log('closed: ' + identPeer)
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
