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
      const s = SignalServer.make(3913)
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
      const s = SignalServer.make(3913)

      s.getServer().on('listening', () => {
        setTimeout(() => { s.shutdown() }, 1000)

        const ws1 = new WebSocket('ws://localhost:3913', {
          perMessageDeflate: false
        })
        ws1.on('open', () => {
          ws1.send('invalid string')
          ws1.send(JSON.stringify({ type: 'register', from: 'client1', to: 'client2' }))
          ws1.send(JSON.stringify({ type: 'invalid object' }))
          ws1.send(JSON.stringify({ type: 'invalid type', from: 'bogus1', to: 'bogus2' }))
        })

        const ws2 = new WebSocket('ws://localhost:3913', {
          perMessageDeflate: false
        })
        ws2.on('open', () => {
          ws2.send(JSON.stringify({ type: 'register', from: 'client2', to: 'client1' }))
          ws2.send(JSON.stringify({ type: 'signal', from: 'client2', to: 'client1' }))
        })
      })
    })
  })
})
