# DIVA.EXCHANGE Signal Server

More about DIVA.EXCHANGE on https://diva.exchange.

## Overview and Architecture
A generic rendezvous server to enable NAT traversal of services located behind firewalls. Let's take a look at the architecture. The figure below uses - as an example - "Iroha" clients as peers. These clients just want to talk to each other.

![Architecture DIVA.EXCHANGE Signal Server](https://www.diva.exchange/wp-content/uploads/2020/05/diva-webrtc-iroha.jpg)

## Getting Started

### Using Docker
If you have docker available on your system, simply start the DIVA signal server as

    docker pull divax/signal

    docker run -d -p 3903:3903 --name diva-signal-server divax/signal
    
Now you have a DIVA signal server running on port 3903 on your host. Test it by accessing http://localhost:3903. If you'd like to expose this DIVA signal server to the outside, either configure port 3903 on your firewall, or use something like an nginx proxy to forward the traffic to your server.

#### nginx Configuration, Reverse Proxy, Example
If you want to set up nginx as a reverse proxy, the following example configuration might be useful:

    map $http_upgrade $connection_upgrade {
      default upgrade;
      ''      close;
    }
    
    server {
      listen 80;
      listen [::]:80;
      server_name your.server.name;
      root /path/to/your/web-server-content;
      location /.well-known/acme-challenge/ { allow all; }
      location / { return 301 https://$host$request_uri; }
    }
    
    server {
      listen 443 ssl http2;
      listen [::]:443 ssl http2;
      server_name your.server.name;
    
      ssl_protocols TLSv1.2 TLSv1.3;
      ssl_ciphers HIGH:!MEDIUM:!LOW:!aNULL:!NULL:!SHA;
      ssl_prefer_server_ciphers on;
      ssl_session_cache shared:SSL:10m;
    
      root /path/to/your/web-server-content;
    
      location / {
        try_files $uri @proxy;
      }
    
      location @proxy {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Proxy "";
        proxy_pass_header Server;
    
        proxy_pass http://127.0.0.1:3903;
        proxy_buffering off;
        proxy_redirect off;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    
        tcp_nodelay on;
      }
    
        ssl_certificate /etc/letsencrypt/live/your.server.name/fullchain.pem; # managed by Certbot
        ssl_certificate_key /etc/letsencrypt/live/your.server.name/privkey.pem; # managed by Certbot
    }


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

## Contact the Developers

Via the [website](https://www.diva.exchange/en/team-and-contact/) - several options, including Chat.

