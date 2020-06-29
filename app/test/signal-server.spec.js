/*!
 * Diva SignalServer Test suite
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */
'use strict'

import { describe, it } from 'mocha'
import { SignalServer } from '../src/signal-server'
import WebSocket from 'ws'

import * as chai from 'chai'
import chaiHttp from 'chai-http'
chai.use(chaiHttp)
const assert = chai.assert

/**
 * Project: diva
 * Context: signal
 */
describe('//diva// /signal', () => {
  describe('SignalServer', () => {
    it('Error, invalid port', () => {
      assert.throws(() => { SignalServer.make(1) }, 'invalid port')
    })

    it('Factory returns a SignalServer instance', () => {
      const s = SignalServer.make(3913)
      assert.instanceOf(s, SignalServer)
      s.shutdown()
    })

    it('Http server response', () => {
      const s = SignalServer.make(3914)
      const request = chai.request(s.getApp())
      request.get('/').then(res => {
        assert.strictEqual(res.status, 200)
      })
      request.get('/index.html').then(res => {
        assert.strictEqual(res.status, 404)
        s.shutdown()
      })
    })

    it('WebSocket Messaging', () => {
      const port = 3915
      const s = SignalServer.make(port)

      s.getServer().on('listening', () => {
        setTimeout(() => { s.shutdown() }, 1000)

        const ws1 = new WebSocket('ws://localhost:' + port, {
          perMessageDeflate: false
        })
        ws1.on('open', () => {
          // errors
          ws1.send('invalid json')
          ws1.send(JSON.stringify(['join', 'test-room']))
          ws1.send(JSON.stringify(['bogus']))
          ws1.send(JSON.stringify({ a: 'bogus' }))
          ws1.send(JSON.stringify(['signal', 'some-ident', 'some-other-ident']))
          ws1.send(JSON.stringify(['signal', 'some-ident', 'some-bogus-ident', 'some-data']))

          // join
          ws1.send(JSON.stringify(['join', 'some-ident', 'other-room']))
          ws1.send(JSON.stringify(['join', 'some-ident', 'other-room']))
          ws1.send(JSON.stringify(['join', 'some-other-ident', 'other-room']))

          ws1.send(JSON.stringify(['ident']))
          ws1.send(JSON.stringify(['ident']))

          ws1.on('message', (data) => {
            const arr = JSON.parse(data)
            switch (arr[0]) {
              case 'ident':
                ws1.send(JSON.stringify(['join', arr[1], 'test-room']))
                break
              case 'join':
                break
              case 'stun':
                ws1.send(JSON.stringify(['signal', 'some-ident', 'some-other-ident', 'some-data']))
                break
              case 'signal':
                break
            }
          })
        })
      })
    })
  })
})
