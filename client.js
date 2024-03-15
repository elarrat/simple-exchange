const { PeerRPCClient } = require('grenache-nodejs-ws');
const { PeerSub } = require('grenache-nodejs-ws');
const Link = require('grenache-nodejs-link');

const Orderbook = require('./domain/orderbook')

class Client {
  orderbook = new Orderbook();

  constructor(address) {
    this.id = Date.now();
    
    this.link = new Link({ 
      grape: address,
      requestTimeout: 10000 
    });
    this.link.start();
    
    this.peerRPC = new PeerRPCClient(this.link, {})
    this.peerRPC.init();

    this.peerSub = new PeerSub(this.link, {});
    this.peerSub.init();
    this.peerSub.sub('exchange-pub', { timeout: 10000 });

    // 4. Consume order from publisher
    this.peerSub.on('message', async (payload) => {
      const newOrder = JSON.parse(payload);
      // 5. Add order to local orderbook and match orders
      const remainerOrder = await this.orderbook.createOrder(newOrder);
      if (remainerOrder) this.createOrder(remainerOrder.symbol, remainerOrder.type, remainerOrder.qty, remainerOrder.price);
      console.log(`client: ${newOrder.clientId}, order: ${JSON.stringify(newOrder)} - created!`);
    })

    console.log(`New client, id: ${this.id}`);
  }

  // 1. Create order and send to exchange-rpc
  createOrder(symbol, type, price, qty) {
    const order = {
      clientId: this.id,
      id: Date.now(),
      symbol,
      type, 
      price, 
      qtyOrdered: qty,
      qtyMatched: 0,
      remainerOrder: null,
    }; 
    
    const payload = JSON.stringify(order);

    this.peerRPC.request('exchange-rpc', payload, { timeout: 30000 }, (err, data) => {
      if (err) throw err;      
    });

    console.log(`client: ${order.clientId}, order: ${JSON.stringify(order)} - sent!`);
  }
}

// Bootstrap client and trigger random orders
const client = new Client('http://127.0.0.1:30001');
setInterval(() => {
  const symbol = Math.random() > 0.5 ? "BTC" : "ETH";
  const type = Math.random() > 0.5 ? "BUY" : "SELL";
  const price = (Math.random() * 10).toFixed(2);
  const qty = Math.ceil(Math.random() * 10)

  client.createOrder(symbol, type, price, qty);
}, 5000);