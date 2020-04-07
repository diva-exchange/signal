# DIVA.EXCHANGE Signal Server
A generic rendezvous server to enable NAT traversal of services located behind firewalls. Let's take a look at the architecture:

![Architecture DIVA.EXCHANGE Signal Server](https://images.squarespace-cdn.com/content/v1/5df2397428acdb23a0c42b1a/1585659503454-CV3OICEJ6BQDHL4SVPZR/ke17ZwdGBToddI8pDm48kH1jbRKTUD0pWoTueEFSb2FZw-zPPgdn4jUwVcJE1ZvWQUxwkmyExglNqGp0IvTJZamWLI2zvYWH8K3-s_4yszcp2ryTI0HqTOaaUohrI8PIUoInBklEqBy6RNIZmUpQyn4PQwoISE14b5-2BJc6ligKMshLAGzx4R3EDFOm1kBS/diva-webrtc-iroha.jpg)

## Getting Started

### Using Docker
If you have docker available on your system, simply start the DIVA signal server as

    docker run -p 3903:3903 diva/signal
    
Now you have a DIVA signal server running on port 3903 on your host. Test it by accessing ws://localhost:3903. If you'd like to expose this DIVA signal server to the outside, either configure port 3903 on your firewall, or use something like an nginx proxy to forward the traffic to your server.

### Using npm 
Start the  server:

    npm start
    
Stop the server:

    npm stop

## How to Run Unit Tests
    npm run test

Coverage reports are stored within `./coverage`. Use any browser and open `./coverage/index.html`.

## How to Lint (eslint)
    npm run lint
