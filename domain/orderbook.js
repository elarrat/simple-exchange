module.exports=class Orderbook {
    buyBook = [];
    sellBook = [];
    isLocked = false;
    
    addOrder(order) {
      switch (order.type) {
        case "SELL": {
          this.sellBook.push(order);
          this.sellBook.sort((a, b) => {
            return a.price - b.price;
          })
        };
        case "BUY": {
          this.buyBook.push(order);
          this.buyBook.sort((a, b) => {
            return b.price - a.price;
          })
        }
      }
    }
  
  
    async matchOrder(openOrders, newOrder) {
      let remainerOrder = null;
  
      for (let i = 0; i < openOrders.length; i += 1) {
        const openOrder = openOrders[i];
  
        const orderQty = openOrder.qtyOrdered - openOrder.qtyMatched;
  
        // Full orders
        if (orderQty >= newOrder.qtyOrdered) {
          openOrder.qtyMatched += newOrder.qtyOrdered;
          newOrder.qtyMatched = newOrder.qtyOrdered;
          
          break;
        }
  
        // Partial orders
        if (orderQty < newOrder.qtyOrdered) {
          openOrder.qtyMatched += orderQty;
          newOrder.qtyMatched += orderQty;
  
          const remainerQty = newOrder.qtyOrdered - newOrder.qtyMatched;
          remainerOrder = { 
            ...newOrder,
            qtyOrdered: remainerQty,
            qtyMatched: 0
          };
          newOrder.remainerOrder = remainerOrder
  
          break;
        }
      }
  
      return remainerOrder;
    }
    
    async createOrder(newOrder) {
      let orderBook = null;
      
      if (this.isLocked) {
        // Wait until the lock is released
        await new Promise((resolve) => {
          const checkLock = () => {
            if (!this.isLocked) resolve();
            else setTimeout(checkLock, 10);
          };
          checkLock();
        });
      }
      
      try {
        this.isLocked = true;
  
        this.addOrder(newOrder);
        
        if (newOrder.type === 'BUY') {
          orderBook = this.sellBook;
          this.sellBook = this.sellBook.filter((openOrder) =>
          openOrder.qtyMatched < openOrder.qtyOrdered
          && openOrder.symbol == newOrder.symbol
          && openOrder.price <= newOrder.price
          && !openOrder.orderRemainer
          );
        } else {
          orderBook = this.buyBook;
          this.buyBook = this.buyBook.filter((openOrder) =>
          openOrder.qtyMatched < openOrder.qtyOrdered
          && openOrder.symbol == newOrder.symbol
          && openOrder.price >= newOrder.price
          && !openOrder.orderRemainer
          );
        }
        
        const remainerOrder = await this.matchOrder(orderBook, newOrder);
        return remainerOrder;
  
      } finally {
        this.isLocked = false;
      }
    }
  }