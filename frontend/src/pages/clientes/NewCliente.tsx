import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function NewCliente() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [planos, setPlanos] = useState<any[]>([]);

  useEffect(() => {
    api.get('/planos').then(r => setPlanos(r.data.planos || r.data || [])).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());
      await api.post('/clientes', data);
      navigate('/clientes');
    } catch (error: any) {
      alert('Erro ao criar cliente: ' + (error.response?.data?.details || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
          <p className="mt-1 text-sm text-gray-500">Preencha os dados do novo cliente</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Dados Pessoais</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                  <input type="text" name="nome_completo" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CPF/CNPJ *</label>
                  <input type="text" name="cpf_cnpj" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-mail</label>
                  <input type="email" name="email" className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input type="text" name="telefone" className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Endereço</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">CEP</label>
                  <input type="text" name="endereco_cep" className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Logradouro</label>
                  <input type="text" name="endereco_logradouro" className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Número</label>
                  <input type="text" name="endereco_numero" className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bairro</label>
                  <input type="text" name="endereco_bairro" className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cidade</label>
                  <input type="text" name="endereco_cidade" className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">UF</label>
                  <input type="text" name="endereco_uf" maxLength={2} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
                </div>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plano *</label>
                  <select name="plano_id" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm">
                    <option value="">Selecione um plano</option>
                    {planos.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nome} - R$ {parseFloat(p.valor_mensal).toFixed(2)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dia de Vencimento *</label>
                  <select name="dia_vencimento" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm">
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((dia) => (
                      <option key={dia} value={dia}>{dia}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Início *</label>
                  <input type="date" name="data_inicio" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6">
              <button type="button" onClick={() => navigate('/clientes')} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700">{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
