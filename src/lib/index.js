/** @module lib */
import { HDPublicKey as BtcHDPublicKey, Address as BtcAddress, Networks as BtcNetworks } from 'bitcore-lib';
import { HDPublicKey as LtcHDPublicKey, Address as LtcAddress, Networks as LtcNetworks } from 'litecore-lib';
import fetch from 'node-fetch';

import { CRYPTOCURRENCIES } from '../constants';

/**
 * @function
 * @description Map ticker name to real currency name
 * @param {string} ticker
 * @returns {string} cryptocurrency
 */
export const cryptoTickerMapper = ticker => CRYPTOCURRENCIES[ticker];

/**
 * Cryptocurrency price object
 * @typedef {Object} CryptoPrice
 * @property {number} price - Price in default unit of given cryptocurrency
 * @property {number} priceSatoshis - Price in smallest unit (satoshis) of given cryptocurrency
 */

/**
 * @function
 * @description Generates BTC address from XPUB with path 'm/0/n'
 * @param {string} BTC_XPUB
 * @param {number} derivationNumber
 * @returns {string} BTC address
 */
export const getBitcoinAddress = (BTC_XPUB, derivationNumber) => {
  const parent = new BtcHDPublicKey(BTC_XPUB);
  const child = parent.derive(0).derive(derivationNumber).publicKey;
  const address = BtcAddress(child, BtcNetworks.livenet);

  return address.toString();
};

/**
 * @function
 * @description Generates LTC address from XPUB with path 'm/0/n'
 * @param {string} LTC_XPUB
 * @param {number} derivationNumber
 * @returns {string} LTC address
 */
export const getLitecoinAddress = (LTC_XPUB, derivationNumber) => {
  const parent = new LtcHDPublicKey(LTC_XPUB);
  const child = parent.derive(0).derive(derivationNumber).publicKey;
  const address = LtcAddress(child, LtcNetworks.livenet);

  return address.toString();
};

/**
 * @function
 * @description Return calculated real-time price for given cryptocurrency
 * @param {string} cryptocurrency - Cryptocurrency for which function calculates the price
 * @param {string} gatewayPriceCurrency - Currency defined in the Gateway
 * @param {number} gatewayPriceValue - Price defined in the Gateway
 * @returns {Promise.<CryptoPrice>} - Calculated price object
 */
export const getPriceInCrypto = async (cryptocurrency, gatewayPriceCurrency, gatewayPriceValue) => {
  if (cryptocurrency === gatewayPriceCurrency) {
    return {
      price: gatewayPriceCurrency,
      priceSatoshis: gatewayPriceCurrency * 100000000,
    };
  }

  try {
    const priceDataResponse = await fetch(`https://api.coinmarketcap.com/v1/ticker/${cryptoTickerMapper(cryptocurrency).toLowerCase()}/?convert=${gatewayPriceCurrency}`);
    const priceData = await priceDataResponse.json();
    const cryptoPrice = (gatewayPriceValue / parseFloat(priceData[0][`price_${gatewayPriceCurrency.toLowerCase()}`])).toFixed(8);

    return {
      price: cryptoPrice,
      priceSatoshis: cryptoPrice * 100000000,
    };
  } catch (error) {
    throw error;
  }
};
