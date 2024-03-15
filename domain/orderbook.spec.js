const Orderbook = require('./orderbook');

describe('Orderbook', () => {
  let book;
  let buyOrder1;
  let buyOrder2;
  let sellOrder1;
  let sellOrder2;

  beforeEach(() => {
    book = new Orderbook();
    buyOrder1 = { clientId: Date.now(), id: Date.now() + 10, symbol: "BTC", type: "BUY", price: 60000, qtyOrdered: 5, qtyMatched: 0, remainerOrder: null };
    buyOrder2 = { clientId: Date.now(), id: Date.now() + 10, symbol: "BTC", type: "BUY", price: 59000, qtyOrdered: 5, qtyMatched: 0, remainerOrder: null };

    sellOrder1 = { clientId: Date.now(), id: Date.now() + 10, symbol: "BTC", type: "SELL", price: 60000, qtyOrdered: 5, qtyMatched: 0, remainerOrder: null };
    sellOrder2 = { clientId: Date.now(), id: Date.now() + 10, symbol: "BTC", type: "SELL", price: 59000, qtyOrdered: 5, qtyMatched: 0, remainerOrder: null };
  });

  describe('addOrder', () => {
    it('adds buy orders', () => {
      book.addOrder(buyOrder1);
      book.addOrder(buyOrder2);

      expect(book.buyBook).toStrictEqual([buyOrder1, buyOrder2]);
    });

    it('adds sell orders', () => {
      book.addOrder(sellOrder1);
      book.addOrder(sellOrder2);

      expect(book.sellBook).toStrictEqual([sellOrder2, sellOrder1]);
    });
  });

  describe('matchOrder', () => {
    it('a sell order matches buy orders without remainer', () => {
      const openBuyOrders = [buyOrder1, buyOrder2];
      const sellOrder  = {
        clientId: Date.now(), id: Date.now() + 10, symbol: "BTC", type: "SELL", 
        price: 60000, qtyOrdered: 3, qtyMatched: 0, remainerOrder: null 
      };

      const remainer = book.matchOrder(openBuyOrders, sellOrder);
      expect(sellOrder.qtyMatched).toBe(3);
      expect(remainer).toBe(null);
      expect(openBuyOrders.find(order => buyOrder1.id).qtyMatched).toBe(3);
    });

    it('a sell order matches buy orders with remainer', () => {
      const openBuyOrders = [buyOrder1, buyOrder2];
      const sellOrder  = {
        clientId: Date.now(), id: Date.now() + 10, symbol: "BTC", type: "SELL", 
        price: 60000, qtyOrdered: 6, qtyMatched: 0, remainerOrder: null 
      };

      const remainer = book.matchOrder(openBuyOrders, sellOrder);
      expect(sellOrder.qtyMatched).toBe(5);
      expect(remainer).toStrictEqual({...sellOrder, remainerOrder: null, qtyOrdered: 1, qtyMatched: 0});
    });

    it('a buy order matches sell orders without remainer', () => {
      const openSellOrders = [sellOrder2, sellOrder1];
      const sellOrder  = {
        clientId: Date.now(), id: Date.now() + 10, symbol: "BTC", type: "BUY", 
        price: 60000, qtyOrdered: 3, qtyMatched: 0, remainerOrder: null 
      };

      const remainer = book.matchOrder(openSellOrders, sellOrder);
      expect(sellOrder.qtyMatched).toBe(3);
      expect(remainer).toBe(null);
      expect(openSellOrders.find(order => buyOrder1.id).qtyMatched).toBe(3);
    });

    it('a buy order matches sell orders with remainer', () => {
      const openBuyOrders = [sellOrder2, sellOrder1];
      const sellOrder  = {
        clientId: Date.now(), id: Date.now() + 10, symbol: "BTC", type: "BUY", 
        price: 60000, qtyOrdered: 6, qtyMatched: 0, remainerOrder: null 
      };

      const remainer = book.matchOrder(openBuyOrders, sellOrder);
      expect(sellOrder.qtyMatched).toBe(5);
      expect(remainer).toStrictEqual({...sellOrder, remainerOrder: null, qtyOrdered: 1, qtyMatched: 0});
    });
  });
});