#!/bin/sh
#
# Copyright (C) 2020 diva.exchange
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
#
# Author/Maintainer: Konrad Bächler <konrad@diva.exchange>
#

# set environment
NODE_ENV=${NODE_ENV:-production}

# catch SIGINT and SIGTERM
trap "pkill -SIGINT node ; sleep 5 ; exit 0" SIGTERM SIGINT

# start application
su node -c "NODE_ENV=${NODE_ENV} PORT=3903 node -r esm app/main.js 2>&1 &"

# wait forever
while true
do
  tail -f /dev/null & wait ${!}
done
