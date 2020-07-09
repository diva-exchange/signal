/**
 * DIVA Signal server
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
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
    this._id = 0
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

    this._server = this._app.listen(port)

    /** @type {WebSocket.Server} */
    this._websocketServer = new WebSocket.Server({
      clientTracking: true,
      server: this._server
    })

    this._websocketServer.on('connection', (socket) => {
      const id = this._id
      let arr = []
      this._id++
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
          this._mapRoom.forEach((mapRoom) => {
            mapRoom.delete(ident)
          })
          this._mapIdent.delete(ident)
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
  shutdown () {
    this._websocketServer.clients.forEach((client) => { client.close() })
    this._server.close(() => {
      Logger.trace('SignalServer closed')
    })
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
    if (!this._mapIdent.has(ident)) {
      this._idents[id].push(ident)
      this._mapIdent.set(ident, id)
    }

    // join a room
    if (!this._mapRoom.has(room)) {
      this._mapRoom.set(room, new Map())
    }

    // a room can be joined only once
    if (this._mapRoom.get(room).has(ident)) {
      return
    }

    this._mapRoom.get(room).set(ident, this._mapIdent.get(ident))
    Logger.trace(room).trace(this._mapRoom.get(room))

    // respond with ident and room
    this._sockets[id].send(JSON.stringify(['join', ident, room]))

    this._mapRoom.get(room).forEach((i, to) => {
      if (ident !== to) {
        this._sockets[i].send(JSON.stringify(['stun', to, ident, true]))
        this._sockets[this._mapIdent.get(ident)].send(JSON.stringify(['stun', ident, to, false]))
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
