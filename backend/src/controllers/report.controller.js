const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Transaction, Category } = require('../models');

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
};

const getMonthName = (month) => {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[month - 1];
};

const getSummaryReport = async (req, res) => {
  try {
    const now = new Date();
    const { startDate, endDate, type = 'summary' } = req.query;
    
    let finalStartDate = startDate;
    let finalEndDate = endDate;
    if (!startDate || !endDate) {
      finalStartDate = `${now.getFullYear()}-01-01`;
      finalEndDate = `${now.getFullYear()}-12-31`;
    }

    const transactions = await Transaction.findAll({
      where: {
        userId: req.user.id,
        date: { [Op.between]: [finalStartDate, finalEndDate] }
      },
      include: [{ model: Category }]
    });

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const expenseCategories = {};
    const incomeCategories = {};
    transactions.forEach(t => {
      if (t.Category) {
        if (t.type === 'expense') {
          expenseCategories[t.Category.name] = (expenseCategories[t.Category.name] || 0) + parseFloat(t.amount);
        } else {
          incomeCategories[t.Category.name] = (incomeCategories[t.Category.name] || 0) + parseFloat(t.amount);
        }
      }
    });

    const topExpenseCategories = Object.entries(expenseCategories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));
    
    const topIncomeCategories = Object.entries(incomeCategories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));

    const monthlyComparison = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = `${year}-${String(month).padStart(2, '0')}-31`;
      
      const monthTransactions = await Transaction.findAll({
        where: {
          userId: req.user.id,
          date: { [Op.between]: [start, end] }
        }
      });
      
      const income = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
      
      monthlyComparison.unshift({
        month: getMonthName(month),
        income,
        expenses,
        balance: income - expenses
      });
    }

    res.json({
      period: { start: finalStartDate, end: finalEndDate },
      totalIncome,
      totalExpenses,
      balance,
      savingsRate,
      topExpenseCategories,
      topIncomeCategories,
      monthlyComparison,
      transactions: type === 'detailed' ? transactions : undefined
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
};

const exportExcel = async (req, res) => {
  try {
    const now = new Date();
    const { startDate, endDate } = req.query;
    
    let finalStartDate = startDate;
    let finalEndDate = endDate;
    if (!startDate || !endDate) {
      finalStartDate = `${now.getFullYear()}-01-01`;
      finalEndDate = `${now.getFullYear()}-12-31`;
    }

    const transactions = await Transaction.findAll({
      where: {
        userId: req.user.id,
        date: { [Op.between]: [finalStartDate, finalEndDate] }
      },
      include: [{ model: Category }],
      order: [['date', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    
    const summarySheet = workbook.addWorksheet('Resumen');
    const summaryData = [
      ['Período', `${finalStartDate} a ${finalEndDate}`],
      ['Total Ingresos', formatCurrency(transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0))],
      ['Total Gastos', formatCurrency(transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0))],
      ['Balance', formatCurrency(transactions.reduce((s, t) => s + (t.type === 'income' ? parseFloat(t.amount) : -parseFloat(t.amount)), 0))]
    ];
    summarySheet.addRows(summaryData);
    
    const transactionsSheet = workbook.addWorksheet('Transacciones');
    transactionsSheet.columns = [
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Descripción', key: 'description', width: 30 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Tipo', key: 'type', width: 12 },
      { header: 'Monto', key: 'amount', width: 15 }
    ];
    
    transactions.forEach(t => {
      transactionsSheet.addRow({
        date: t.date,
        description: t.description,
        category: t.Category ? t.Category.name : 'Sin categoría',
        type: t.type === 'income' ? 'Ingreso' : 'Gasto',
        amount: parseFloat(t.amount)
      });
    });
    
    const categoriesMap = {};
    transactions.forEach(t => {
      if (t.Category) {
        const key = `${t.type}-${t.Category.name}`;
        if (!categoriesMap[key]) {
          categoriesMap[key] = { type: t.type, name: t.Category.name, amount: 0 };
        }
        categoriesMap[key].amount += parseFloat(t.amount);
      }
    });
    
    const categoriesSheet = workbook.addWorksheet('Por Categoría');
    categoriesSheet.columns = [
      { header: 'Tipo', key: 'type', width: 12 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Monto', key: 'amount', width: 15 }
    ];
    
    Object.values(categoriesMap).forEach(c => {
      categoriesSheet.addRow({
        type: c.type === 'income' ? 'Ingreso' : 'Gasto',
        category: c.name,
        amount: parseFloat(c.amount)
      });
    });

    [summarySheet, transactionsSheet, categoriesSheet].forEach(sheet => {
      sheet.getRow(1).eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366f1' } };
        cell.font = { color: { argb: 'ffffff' }, bold: true };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      
      sheet.eachRow({ includeEmpty: true }, row => {
        row.eachCell(cell => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      });
    });

    transactionsSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const typeCell = row.getCell(4);
        if (typeCell.value === 'Ingreso') {
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'd1fae5' } };
          });
        } else if (typeCell.value === 'Gasto') {
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'fee2e2' } };
          });
        }
      }
    });

    const fileName = `reporte_gastos_${now.toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al exportar Excel' });
  }
};

const exportPDF = async (req, res) => {
  try {
    const now = new Date();
    const { startDate, endDate } = req.query;
    
    let finalStartDate = startDate;
    let finalEndDate = endDate;
    if (!startDate || !endDate) {
      finalStartDate = `${now.getFullYear()}-01-01`;
      finalEndDate = `${now.getFullYear()}-12-31`;
    }

    const transactions = await Transaction.findAll({
      where: {
        userId: req.user.id,
        date: { [Op.between]: [finalStartDate, finalEndDate] }
      },
      include: [{ model: Category }],
      order: [['date', 'ASC']]
    });

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
    const balance = totalIncome - totalExpenses;

    const doc = new PDFDocument();
    const fileName = `reporte_gastos_${now.toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    doc.pipe(res);

    doc.fontSize(24).text('Reporte de Gastos', { align: 'center' });
    doc.fontSize(12).text(`Período: ${finalStartDate} - ${finalEndDate}`, { align: 'center' });
    doc.text(`Generado: ${now.toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).text('Resumen', { underline: true });
    doc.moveDown();

    const summaryY = doc.y;
    doc.rect(50, summaryY, 150, 80).fillAndStroke('#d1fae5', '#22c55e');
    doc.fillColor('#166534').fontSize(14).text('Ingresos', 70, summaryY + 20, { width: 110, align: 'center' });
    doc.fontSize(18).text(formatCurrency(totalIncome), 70, summaryY + 45, { width: 110, align: 'center' });

    doc.rect(220, summaryY, 150, 80).fillAndStroke('#fee2e2', '#ef4444');
    doc.fillColor('#991b1b').fontSize(14).text('Gastos', 240, summaryY + 20, { width: 110, align: 'center' });
    doc.fontSize(18).text(formatCurrency(totalExpenses), 240, summaryY + 45, { width: 110, align: 'center' });

    doc.rect(390, summaryY, 150, 80).fillAndStroke('#dbeafe', '#3b82f6');
    doc.fillColor('#1e40af').fontSize(14).text('Balance', 410, summaryY + 20, { width: 110, align: 'center' });
    doc.fontSize(18).text(formatCurrency(balance), 410, summaryY + 45, { width: 110, align: 'center' });

    doc.moveDown(5);
    doc.fillColor('#000000').fontSize(16).text('Transacciones', { underline: true });
    doc.moveDown();

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 130;
    const col3 = 300;
    const col4 = 400;
    const col5 = 480;
    const rowHeight = 25;

    doc.fontSize(12).fillColor('#6366f1');
    doc.text('Fecha', col1, tableTop);
    doc.text('Descripción', col2, tableTop);
    doc.text('Categoría', col3, tableTop);
    doc.text('Tipo', col4, tableTop);
    doc.text('Monto', col5, tableTop);

    doc.fillColor('#000000');
    let currentY = tableTop + rowHeight;
    transactions.forEach((t, i) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      doc.text(t.date, col1, currentY);
      doc.text(t.description, col2, currentY);
      doc.text(t.Category ? t.Category.name : 'Sin categoría', col3, currentY);
      doc.text(t.type === 'income' ? 'Ingreso' : 'Gasto', col4, currentY);
      doc.text(formatCurrency(parseFloat(t.amount)), col5, currentY);
      currentY += rowHeight;
    });

    let pageCount = 1;
    doc.on('pageAdded', () => {
      pageCount++;
      doc.page.margins.bottom = 50;
    });

    const endPage = () => {
      doc.fontSize(10).fillColor('#666666').text(`Página ${pageCount}`, 250, 750, { align: 'center' });
    };
    endPage();
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al exportar PDF' });
  }
};

module.exports = {
  getSummaryReport,
  exportExcel,
  exportPDF
};
