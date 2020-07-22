/**
 * diva Signal Server
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { SignalServer } from 'src/signal-server'

SignalServer.make(process.env.PORT || 3913)
