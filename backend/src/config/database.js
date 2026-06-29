const { Sequelize } = require('sequelize')
const path = require('path')

let sequelize

if (process.env.DATABASE_URL) {
  // Producción: PostgreSQL en Railway
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  })
} else {
  // Desarrollo local: SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false
  })
}

module.exports = sequelize
