const { User } = require('../models');

let ratesCache = {
  data: null,
  timestamp: null
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const ALLOWED_CURRENCIES = ['COP', 'USD', 'EUR'];

const getRates = async (req, res) => {
  try {
    const now = Date.now();

    if (ratesCache.data && (now - ratesCache.timestamp < CACHE_DURATION)) {
      return res.json(ratesCache.data);
    }

    const response = await fetch('https://open.er-api.com/v6/latest/COP');
    const data = await response.json();

    const relevantRates = {
      base: 'COP',
      rates: {
        COP: 1,
        USD: data.rates.USD,
        EUR: data.rates.EUR
      },
      lastUpdated: new Date(data.time_last_update_utc || new Date())
    };

    ratesCache = {
      data: relevantRates,
      timestamp: now
    };

    res.json(relevantRates);
  } catch (error) {
    console.error('Error fetching rates:', error);
    res.status(500).json({ message: 'Error fetching exchange rates' });
  }
};

const convertAmount = async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!ALLOWED_CURRENCIES.includes(fromCurrency) || !ALLOWED_CURRENCIES.includes(toCurrency)) {
      return res.status(400).json({ message: 'Invalid currency' });
    }

    const now = Date.now();

    if (!ratesCache.data || (now - ratesCache.timestamp >= CACHE_DURATION)) {
      const response = await fetch('https://open.er-api.com/v6/latest/COP');
      const data = await response.json();
      ratesCache = {
        data: {
          base: 'COP',
          rates: {
            COP: 1,
            USD: data.rates.USD,
            EUR: data.rates.EUR
          },
          lastUpdated: new Date(data.time_last_update_utc || new Date())
        },
        timestamp: now
      };
    }

    const rates = ratesCache.data.rates;
    const rate = rates[toCurrency] / rates[fromCurrency];
    const convertedAmount = amount * rate;

    res.json({
      originalAmount: amount,
      convertedAmount: convertedAmount,
      fromCurrency,
      toCurrency,
      rate
    });
  } catch (error) {
    console.error('Error converting amount:', error);
    res.status(500).json({ message: 'Error converting amount' });
  }
};

const updateUserCurrency = async (req, res) => {
  try {
    const { currency } = req.body;

    if (!ALLOWED_CURRENCIES.includes(currency)) {
      return res.status(400).json({ message: 'Invalid currency' });
    }

    const user = await User.findByPk(req.user.id);
    user.currency = currency;
    await user.save();

    res.json({ message: 'Moneda actualizada', currency });
  } catch (error) {
    console.error('Error updating currency:', error);
    res.status(500).json({ message: 'Error updating currency' });
  }
};

const getUserCurrency = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({ currency: user.currency });
  } catch (error) {
    console.error('Error getting currency:', error);
    res.status(500).json({ message: 'Error getting currency' });
  }
};

module.exports = {
  getRates,
  convertAmount,
  updateUserCurrency,
  getUserCurrency
};
