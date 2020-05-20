/*!
 * DIVA Signal server
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import express from 'express'
import path from 'path'
import WebSocket from 'ws'

import { Logger } from '@diva.exchange/diva-logger'

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
    this._mapPeers = new Map()

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
      socket.on('message', (message) => {
        let obj = {}
        try {
          obj = JSON.parse(message)
          if (!obj.type || !obj.from || !obj.to) {
            Logger.trace('invalid object')
            return
          }
        } catch (error) {
          Logger.trace(error)
          return
        }

        switch (obj.type) {
          case 'register':
            this._register(obj, socket)
            break
          case 'signal':
            this._signal(obj)
            break
          default:
            Logger.error('unknown message type')
        }
      })
      socket.on('close', (code, reason) => {
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
   * @returns {WebSocket.Server}
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
   * @param obj
   * @param socket
   * @private
   */
  _register (obj, socket) {
    const identFrom = obj.from + ':' + obj.to
    const identTo = obj.to + ':' + obj.from

    this._mapPeers.set(identFrom, {
      from: obj.from,
      socket: socket,
      to: obj.to
    })

    if (this._mapPeers.has(identTo)) {
      // socket is the initiator
      socket.send(JSON.stringify({
        type: 'init',
        from: obj.from,
        to: obj.to
      }))

      const objTo = this._mapPeers.get(identTo)
      // socket is the recipient
      objTo.socket.send(JSON.stringify({
        type: 'rcpt',
        from: objTo.from,
        to: objTo.to
      }))
    }
  }

  /**
   * @param obj
   * @private
   */
  _signal (obj) {
    const identTo = obj.to + ':' + obj.from
    this._mapPeers.get(identTo).socket.send(JSON.stringify({
      type: 'signal',
      from: obj.to,
      to: obj.from,
      data: obj.signal
    }))
  }
}

module.exports = { SignalServer }
