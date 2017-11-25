/** @module orderRouter */
import { getBitcoinAddress, getLitecoinAddress, getPriceInCrypto } from '../../lib';
import models from '../../models/';

const { Order, Gateway } = models;

const ORDER_EXPIRATION = parseInt(process.env.ORDER_EXPIRATION, 10);

/**
 * @description Set order state
 * @param {string} orderId - UUID of Order that should be expired
 * @param {string} state - order state which should be set
 * @param {function} unsubscribe - Callback function
 */
const setOrderState = async (orderId, state, unsubscribe) => {
  try {
    const order = await Order.findOne({
      where: {
        id: orderId,
        state: 'new',
      },
    });

    if (order) {
      order.update({ state });
      unsubscribe();
    }
  } catch (error) {
    throw error;
  }
};

export const setOrder = async (req, res, next) => {
  const {
    gatewayId, cryptocurrency, name, email,
  } = req.body;

  if (!gatewayId) {
    return next(new Error('No Gateway ID specified'));
  }

  const pusher = req.app.get('pusher');

  try {
    const orderCount = await Order.count({
      where: {
        GatewayId: gatewayId,
        cryptocurrency,
      },
    });

    const gateway = await Gateway.findOne({
      where: {
        id: gatewayId,
      },
    });

    if (!gateway) {
      return next(new Error('No Gateway found in database'));
    }

    /**
     * Get price in crypto
		 */
    const cryptoPrice = await getPriceInCrypto(cryptocurrency, gateway.price_currency, gateway.price_value);

    let address = null;
    switch (cryptocurrency) {
      case 'BTC':
        address = getBitcoinAddress(gateway.BTC_XPUB, orderCount);
        break;
      case 'LTC':
        address = getLitecoinAddress(gateway.LTC_XPUB, orderCount);
        break;
      default:
        return next(new Error('Cryptocurrency error when getting transaction info'));
    }

    // subscribe to the channel for address updates updates (new transactions only)
    const ticker = pusher.subscribe(`address_${cryptocurrency.toLowerCase()}_${address}`);

    try {
      const newOrder = await Order.create({
        name,
        email,
        address,
        cryptocurrency,
        value_satoshis: cryptoPrice.priceSatoshis,
        state: 'new',
        GatewayId: gateway.id,
      }, {
        include: [Gateway],
      });

      const unsubscribe = () => {
        pusher.unsubscribe(`address_${cryptocurrency.toLowerCase()}_${address}`);
      };

      /**
			 * Automatically expire order after given time
			 */
      setTimeout(setOrderState, ORDER_EXPIRATION, newOrder.id, 'expired', unsubscribe);

      ticker.bind('tx_update', (data) => {
        if (data.type === 'address') {
          if (data.value.value_received * 100000000 === cryptoPrice.priceSatoshis) {
            setOrderState(newOrder.id, 'paid', unsubscribe);
          } else if (data.value.value_received * 100000000 < cryptoPrice.priceSatoshis) {
            setOrderState(newOrder.id, 'underpaid', unsubscribe);
          } else if (data.value.value_received * 100000000 > cryptoPrice.priceSatoshis) {
            setOrderState(newOrder.id, 'overpaid', unsubscribe);
          } else {
            throw new Error('Unexpected transaction state');
          }
        }
      });

      return res.json({ ...newOrder.toJSON() });
    } catch (error) {
      return next(error);
    }
  } catch (error) {
    return next(error);
  }
};

export const getOrder = async (req, res, next) => {
  if (!req.params.orderId) {
    return next(new Error('No Order ID specified'));
  }

  try {
    const order = await Order.findOne({
      where: {
        id: req.params.orderId,
      },
    });
    return res.json({ ...order.toJSON() });
  } catch (error) {
    return next(error);
  }
};
