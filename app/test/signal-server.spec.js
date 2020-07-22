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
                assert.isString(arr[1])
                ws1.send(JSON.stringify(['join', arr[1], 'test-room']))
                break
              case 'join':
                assert.isString(arr[1])
                break
              case 'stun':
                ws1.send(JSON.stringify(['signal', 'some-ident', 'some-other-ident', 'some-data']))
                break
            }
          })
        })
      })
    })
  })
})
