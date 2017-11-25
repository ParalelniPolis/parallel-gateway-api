import { CRYPTOCURRENCIES } from '../constants';

export default (sequelize, DataTypes) => {
  const Gateway = sequelize.define('Gateway', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    price_currency: {
      type: DataTypes.ENUM,
      values: ['CZK', 'USD', 'EUR', ...Object.keys(CRYPTOCURRENCIES)],
      defaultValue: 'USD',
      allowNull: false,
    },
    price_value: {
      type: DataTypes.INTEGER,
    },
    BTC_XPUB: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    LTC_XPUB: {
      type: DataTypes.STRING,
      unique: true,
    },
  });

  Gateway.associate = (models) => {
    Gateway.hasMany(models.Order);
  };

  return Gateway;
};
