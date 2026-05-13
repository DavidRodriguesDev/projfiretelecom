import React, { useState } from 'react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Relatorios() {
  const [loading, setLoading] = useState(false);

  const gerarPDF = async () => {
    setLoading(true);
    try {
      const [clientesRes, boletosRes, statsRes] = await Promise.all([
        api.get('/clientes?limit=1000'),
        api.get('/boletos?limit=1000'),
        api.get('/dashboard/estatisticas'),
      ]);

      const clientes = clientesRes.data.clientes || [];
      const boletos = boletosRes.data.boletos || [];
      const stats = statsRes.data;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(20);
      doc.setTextColor(30, 64, 175);
      doc.text('Fire Telecom', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text('Relatorio Gerencial', pageWidth / 2, 28, { align: 'center' });
      doc.text('Gerado em: ' + new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'), pageWidth / 2, 35, { align: 'center' });

      let y = 45;

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('1. Resumo Executivo', 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [['Indicador', 'Valor']],
        body: [
          ['Total de Clientes', String(stats.totalClientes)],
          ['Clientes Ativos', String(stats.clientesAtivos)],
          ['Clientes Inadimplentes', String(stats.clientesInadimplentes)],
          ['Clientes Cancelados', String(stats.clientesCancelados)],
          ['Boletos Pendentes', String(stats.boletosPendentes)],
          ['Boletos Pagos', String(stats.boletosPagos)],
          ['Receita Prevista', 'R$ ' + parseFloat(stats.receitaPrevista || 0).toFixed(2)],
          ['Receita Recebida', 'R$ ' + parseFloat(stats.receitaRecebida || 0).toFixed(2)],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [30, 64, 175] },
        alternateRowStyles: { fillColor: [240, 245, 255] },
      });

      y = (doc as any).lastAutoTable.finalY + 15;

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('2. Clientes', 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [['Nome', 'CPF/CNPJ', 'Plano', 'Status', 'Vencimento']],
        body: clientes.map((c: any) => [
          c.nome_completo,
          c.cpf_cnpj,
          c.plano_nome || '-',
          c.status,
          'Dia ' + c.dia_vencimento,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 64, 175] },
        alternateRowStyles: { fillColor: [240, 245, 255] },
      });

      y = (doc as any).lastAutoTable.finalY + 15;

      const inadimplentes = clientes.filter((c: any) => c.status === 'INADIMPLENTE');
      if (inadimplentes.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('3. Inadimplencia', 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          head: [['Nome', 'CPF/CNPJ', 'Plano', 'Vencimento']],
          body: inadimplentes.map((c: any) => [
            c.nome_completo,
            c.cpf_cnpj,
            c.plano_nome || '-',
            'Dia ' + c.dia_vencimento,
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [220, 38, 38] },
          alternateRowStyles: { fillColor: [255, 240, 240] },
        });

        y = (doc as any).lastAutoTable.finalY + 15;
      }

      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('4. Boletos', 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [['Cliente', 'Plano', 'Valor', 'Vencimento', 'Status']],
        body: boletos.map((b: any) => [
          b.cliente_nome || '-',
          b.plano_nome || '-',
          'R$ ' + parseFloat(b.valor || 0).toFixed(2),
          new Date(b.data_vencimento).toLocaleDateString('pt-BR'),
          b.status,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 64, 175] },
        alternateRowStyles: { fillColor: [240, 245, 255] },
      });

      doc.save('relatorio-firetelecom-' + new Date().toISOString().split('T')[0] + '.pdf');
      alert('Relatorio gerado com sucesso!');
    } catch (error: any) {
      alert('Erro ao gerar relatorio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Relatorios</h1>
          <p className="mt-1 text-sm text-gray-500">Gere relatorios completos do sistema em PDF</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Relatorio Gerencial Completo</h2>
            <p className="text-sm text-gray-500 mb-4">Inclui resumo executivo, listagem de clientes, inadimplencia e boletos.</p>
            <ul className="text-sm text-gray-600 space-y-1 mb-6 list-disc list-inside">
              <li>Resumo executivo com indicadores</li>
              <li>Listagem completa de clientes</li>
              <li>Clientes inadimplentes</li>
              <li>Listagem de boletos</li>
            </ul>
            <button
              onClick={gerarPDF}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Gerando PDF...' : 'Gerar Relatorio PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
