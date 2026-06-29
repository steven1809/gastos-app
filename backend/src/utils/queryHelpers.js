const { Sequelize } = require('sequelize')

// Detectar si estamos en PostgreSQL o SQLite
const isPostgres = () => !!process.env.DATABASE_URL

// Filtro por mes compatible con ambas DBs
const monthFilter = (column, month) => {
  if (isPostgres()) {
    return Sequelize.where(
      Sequelize.fn('EXTRACT', Sequelize.literal(`MONTH FROM "${column}"`)),
      parseInt(month)
    )
  } else {
    return Sequelize.where(
      Sequelize.fn('strftime', '%m', Sequelize.col(column)),
      String(month).padStart(2, '0')
    )
  }
}

// Filtro por año compatible con ambas DBs
const yearFilter = (column, year) => {
  if (isPostgres()) {
    return Sequelize.where(
      Sequelize.fn('EXTRACT', Sequelize.literal(`YEAR FROM "${column}"`)),
      parseInt(year)
    )
  } else {
    return Sequelize.where(
      Sequelize.fn('strftime', '%Y', Sequelize.col(column)),
      String(year)
    )
  }
}

// Filtro por mes-año
const monthYearFilter = (column, month, year) => {
  return [monthFilter(column, month), yearFilter(column, year)]
}

// Formato de mes para groupBy en reportes
const monthFormat = (column) => {
  if (isPostgres()) {
    return Sequelize.fn('TO_CHAR', Sequelize.col(column), 'YYYY-MM')
  } else {
    return Sequelize.fn('strftime', '%Y-%m', Sequelize.col(column))
  }
}

// Formato de fecha completa
const dateFormat = (column) => {
  if (isPostgres()) {
    return Sequelize.fn('TO_CHAR', Sequelize.col(column), 'YYYY-MM-DD')
  } else {
    return Sequelize.fn('strftime', '%Y-%m-%d', Sequelize.col(column))
  }
}

module.exports = { monthFilter, yearFilter, monthYearFilter, monthFormat, dateFormat, isPostgres }
