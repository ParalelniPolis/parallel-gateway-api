import { CRYPTOCURRENCIES } from '../constants';

export default (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      },
    },
    address: {
      type: DataTypes.STRING,
      unique: true,
    },
    value_satoshis: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    cryptocurrency: {
      type: DataTypes.ENUM,
      values: Object.keys(CRYPTOCURRENCIES),
    },
    state: {
      type: DataTypes.ENUM,
      values: ['new', 'canceled', 'expired', 'paid', 'paid_after', 'overpaid', 'underpaid'],
      defaultValue: 'new',
    },
  });

  Order.associate = (models) => {
    Order.belongsTo(models.Gateway);
  };

  return Order;
};
