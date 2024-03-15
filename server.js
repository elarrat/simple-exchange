'use strict'

const { PeerRPCServer } = require('grenache-nodejs-ws');
const { PeerPub } = require('grenache-nodejs-ws');
const Link = require('grenache-nodejs-link');

class Server {
  constructor(address) {
    this.link = new Link({ grape: address });
    this.link.start();

    this.peerRPC = new PeerRPCServer(this.link, { timeout: 30000 });
    this.peerRPC.init();

    this.serviceRPC = this.peerRPC.transport('server');
    this.serviceRPC.listen(1337);

    this.peerPub = new PeerPub(this.link, {});
    this.peerPub.init();

    const port = Math.ceil(Math.random() * 1000) + 1024;
    this.servicePub = this.peerPub.transport('server');
    this.servicePub.listen(port);

    this.link.startAnnouncing('exchange-rpc', this.serviceRPC.port, {});
    this.link.startAnnouncing('exchange-pub', this.servicePub.port, {});

    // 2. Receive order from client
    this.serviceRPC.on('request', (rid, key, payload, handler) => 
      // 3. Fan out order to subscribers
      this.servicePub.pub(payload)
    );

    console.log(`Server is running`);
  }
}

// Start listening
new Server('http://127.0.0.1:30001');