import React from 'react';
import Button from './Button';

const ExportButtons = ({ onExportExcel, onExportPDF, loadingExcel = false, loadingPDF = false }) => {
  return (
    <div className="flex gap-3">
      <Button
        variant="secondary"
        onClick={onExportExcel}
        loading={loadingExcel}
      >
        📊 Exportar Excel
      </Button>
      <Button
        variant="secondary"
        onClick={onExportPDF}
        loading={loadingPDF}
      >
        📄 Exportar PDF
      </Button>
    </div>
  );
};

export default ExportButtons;
