/*!
 * hangout signal server
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import Peer from 'simple-peer'
import wrtc from 'wrtc'
import WebSocket from 'ws'

const map = {
  client1: ['client2', 'client4'],
  client2: ['client1', 'client3'],
  client3: ['client2', 'client4'],
  client4: ['client1', 'client3']
}

let ident = ''
if (!process.argv[2] || !map[process.argv[2]]) {
  ident = 'client1'
} else {
  ident = process.argv[2]
}

console.log(ident)

const websocket = new WebSocket('wss://signal.diva.exchange', {
  perMessageDeflate: false
})

websocket.on('open', () => {
  // send all connection requests to websocket
  map[ident].forEach((to) => {
    // @TODO sign message with the private key of this client
    websocket.send(JSON.stringify({
      type: 'register',
      from: ident,
      to: to
    }))
  })
})

const peers = {}

websocket.on('message', (message) => {
  let obj = {}
  try {
    obj = JSON.parse(message)
  } catch (error) {
    return
  }

  init(obj)
})

function init (obj) {
  const _id = obj.from + ':' + obj.to
  console.log(_id)
  switch (obj.type) {
    case 'init':
    case 'rcpt':
      peers[_id] = new Peer({
        config: { iceServers: [{ urls: 'stun:kopanyo.com:3478' }] },
        initiator: obj.type === 'init',
        wrtc: wrtc
      })
      peers[_id].on('error', (error) => {
        console.log('ERROR', error)
        peers[_id] = false
      })
      // this is incoming from STUN/TURN
      peers[_id].on('signal', (data) => {
        const json = JSON.stringify({
          type: 'signal',
          signal: data,
          from: ident,
          to: obj.to
        })
        console.log('SIGNAL', json)
        websocket.send(json)
      })
      peers[_id].on('connect', () => {
        // wait for 'connect' event before using the data channel
        peers[_id].send('hey ' + obj.to + ', how is it going? Greetings, ' + obj.from)
      })
      peers[_id].on('data', (data) => {
        // got a data channel message
        console.log('got data: ' + data)
      })
      break
    case 'signal':
      if (peers[_id]) {
        peers[_id].signal(obj.data)
      }
      break
    default:
      break
  }
}
