/** @module gatewayRouter */
import models from '../../models/';

const { Gateway } = models;

export const getGateway = async (req, res, next) => {
  if (!req.params.gatewayId) {
    return next(new Error('No Gateway ID specified'));
  }
  try {
    const gateway = await Gateway.findOne({
      where: {
  		id: req.params.gatewayId,
      },
    });
  	if (gateway) {
      return res.json({
        id: gateway.id,
        name: gateway.name,
        description: gateway.description,
        price: {
          currency: gateway.price_currency,
          value: gateway.price_value,
        },
        cryptocurrencies: {
          BTC: !!gateway.BTC_XPUB,
          LTC: !!gateway.LTC_XPUB,
        },
      });
    }
    return res.status(404).json({
      error: {
        	message: 'Gateway not found!',
      },
    });
  } catch (error) {
  	return next(error);
  }
};
