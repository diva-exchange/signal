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

import express from 'express'
import { customAlphabet } from 'nanoid'
import path from 'path'
import WebSocket from 'ws'

import { Logger } from '@diva.exchange/diva-logger'

const CUSTOM_ALPHABET = 'ABCDFGHJKMNPQRSTVWXYZabcdfghjkmnpqrstvwxyz'

export class SignalServer {
  /**
   * Factory
   *
   * @param port {number} Range: 1025 - 65535
   * @returns {SignalServer}
   * @public
   */
  static make (port) {
    const _p = Math.floor(port)
    if (_p < 1025 || _p > 65535) {
      throw new Error('invalid port')
    }
    return new SignalServer(_p)
  }

  /**
   * Constructor
   *
   * @param port {number}
   * @private
   */
  constructor (port) {
    this._id = 1
    this._sockets = []
    this._idents = []
    this._mapIdent = new Map()
    this._mapRoom = new Map()

    /** @type {Function} */
    this._app = express()
    // generic
    this._app.set('x-powered-by', false)

    this._app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '/../view/index.html'))
    })

    this._app.use((req, res) => {
      res.status(404).sendFile(path.join(__dirname, '/../view/404.html'))
    })

    this._server = this._app.listen(port, () => {
      Logger.info(`SignalServer listening on port ${port}`)
    })

    /** @type {WebSocket.Server} */
    this._websocketServer = new WebSocket.Server({
      clientTracking: true,
      server: this._server
    })

    this._websocketServer.on('connection', (socket) => {
      let arr = []
      const id = this._id++
      this._sockets[id] = socket
      this._idents[id] = []
      socket.on('message', (message) => {
        try {
          arr = JSON.parse(message)
          if (!Array.isArray(arr) || !arr[0]) {
            return
          }

          switch (arr.shift()) {
            case 'ident':
              this._ident(arr, id)
              break
            case 'join':
              this._join(arr, id)
              break
            case 'signal':
              this._signal(arr)
              break
            case 'ping':
              socket.send(JSON.stringify(['pong']))
              break
            default:
              break
          }
        } catch (error) {
          Logger.error(error)
        }
      })

      socket.on('close', (code, reason) => {
        this._idents[id].forEach((ident) => {
          this._mapRoom.forEach((mapRoom, room) => {
            mapRoom.delete(ident)
            this._mapIdent.delete(room + ':' + ident)
          })
        })
        delete this._idents[id]
        delete this._sockets[id]
        Logger.trace(code + ' ' + reason)
      })
    })
  }

  /**
   * Shutdown the server
   * @public
   */
  async shutdown () {
    this._websocketServer.clients.forEach((client) => { client.close() })
    await this._server.close()
    Logger.info('SignalServer closed')
  }

  /**
   * @returns {Function} Express app
   */
  getApp () {
    return this._app
  }

  /**
   * @returns {WebSocket.Server}
   */
  getServer () {
    return this._server
  }

  /**
   * @param arr {Array} Data array, according to API spec
   * @param id {Number} Id of the WebSocket
   * @return void
   * @private
   */
  async _ident (arr, id) {
    const nanoid = customAlphabet(CUSTOM_ALPHABET, Math.floor(Math.random() * 12) + 12)
    const ident = await nanoid()

    // send the new ident
    this._sockets[id].send(JSON.stringify(['ident', ident]))
    this._idents[id].push(ident)
  }

  // @TODO check validity of ident, like on the iroha blockchain
  /**
   * Join a room
   *
   * @param arr {Array} Data array, according to API spec
   * @param id {Number} Id of the WebSocket
   * @private
   */
  _join (arr, id) {
    if (arr.length !== 2) {
      return
    }
    const [ident, room] = arr

    // store the given ident locally
    const globalIdent = room + ':' + ident
    if (!this._mapIdent.has(globalIdent)) {
      this._idents[id].push(ident)
      this._mapIdent.set(globalIdent, id)
    }

    // join a room
    if (!this._mapRoom.has(room)) {
      this._mapRoom.set(room, new Map())
    }

    // a room can be joined only once
    if (this._mapRoom.get(room).has(ident)) {
      return
    }

    this._mapRoom.get(room).set(ident, this._mapIdent.get(globalIdent))
    Logger.trace(room).trace(this._mapRoom.get(room))

    // respond with ident and room
    this._sockets[id].send(JSON.stringify(['join', globalIdent]))

    this._mapRoom.get(room).forEach((i, to) => {
      if (ident !== to) {
        this._sockets[i].send(
          JSON.stringify(['stun', room + ':' + to, globalIdent, true])
        )
        this._sockets[this._mapIdent.get(globalIdent)].send(
          JSON.stringify(['stun', globalIdent, room + ':' + to, false])
        )
      }
    })
  }

  /**
   * @param arr {Array} Data array, according to API spec
   * @private
   */
  _signal (arr) {
    if (arr.length !== 3) {
      return
    }
    const [from, to, data] = arr

    if (this._mapIdent.has(to)) {
      this._sockets[this._mapIdent.get(to)].send(JSON.stringify(['signal', to, from, data]))
    }
  }
}

module.exports = { SignalServer }
