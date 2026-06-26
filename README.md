# Gastos App

Aplicación de control de gastos con autenticación, reportes y visualizaciones.

## Tecnologías

### Backend
- Node.js + Express
- Sequelize ORM
- SQLite
- JWT + bcryptjs (autenticación)
- exceljs + pdfkit (reportes)

### Frontend
- React + Vite
- Tailwind CSS
- React Router DOM
- Axios
- Chart.js + react-chartjs-2

## Instalación

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Estructura del Proyecto
```
gastos-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   └── index.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
└── README.md
```
