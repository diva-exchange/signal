/**
 * Copyright (C) 2020 diva.exchange
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Author/Maintainer: Konrad Bächler <konrad@diva.exchange>
 */

'use strict'

import { SignalServer } from './src/signal-server'
import { Logger } from '@diva.exchange/diva-logger'

process.env.LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'trace')
Logger.setOptions({ name: 'SignalServer' })

const server = SignalServer.make(process.env.PORT || 3913)

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.once(sig, () => {
    server.shutdown().then(() => {
      process.exit(0)
    })
  })
}
