import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Plano {
  id: string;
  nome: string;
  velocidade: string;
  velocidade_mbps: number;
  valor_mensal: string;
  tipo_plano: string;
  descricao: string;
  ativo: boolean;
}

export default function Planos() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Plano | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPlanos(); }, []);

  const loadPlanos = async () => {
    try {
      const r = await api.get('/planos');
      setPlanos(r.data.planos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const abrirNovo = () => { setEditando(null); setModal(true); };
  const abrirEditar = (p: Plano) => { setEditando(p); setModal(true); };
  const fecharModal = () => { setModal(false); setEditando(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data: any = Object.fromEntries(formData.entries());
      data.velocidade_mbps = parseInt(data.velocidade_mbps);
      data.ativo = data.ativo === 'true';
      if (editando) {
        await api.put(`/planos/${editando.id}`, data);
        alert('Plano atualizado com sucesso!');
      } else {
        await api.post('/planos', data);
        alert('Plano criado com sucesso!');
      }
      fecharModal();
      loadPlanos();
    } catch (error: any) {
      alert('Erro: ' + (error.response?.data?.details || error.message));
    } finally {
      setSaving(false);
    }
  };

  const excluir = async (id: string) => {
    if (!confirm('Deseja excluir este plano?')) return;
    try {
      await api.delete(`/planos/${id}`);
      loadPlanos();
    } catch (error: any) {
      alert('Erro ao excluir: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Planos</h1>
          <button onClick={abrirNovo} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">+ Novo Plano</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {planos.map((plano) => (
              <div key={plano.id} className="bg-white shadow rounded-lg border border-gray-200">
                <div className="px-4 py-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{plano.nome}</h3>
                      <p className="text-sm text-gray-500 mt-1">{plano.velocidade} - {plano.velocidade_mbps} Mbps</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">R$ {parseFloat(plano.valor_mensal).toFixed(2)}</div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tipo:</span>
                      <span className="font-medium">{plano.tipo_plano}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-medium ${plano.ativo ? 'text-green-600' : 'text-red-600'}`}>{plano.ativo ? 'Ativo' : 'Inativo'}</span>
                    </div>
                    {plano.descricao && <p className="text-sm text-gray-500 mt-2">{plano.descricao}</p>}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t flex justify-end space-x-3">
                  <button onClick={() => abrirEditar(plano)} className="text-sm text-blue-600 hover:text-blue-900">Editar</button>
                  <button onClick={() => excluir(plano.id)} className="text-sm text-red-600 hover:text-red-900">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-4">{editando ? 'Editar Plano' : 'Novo Plano'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome *</label>
                <input type="text" name="nome" required defaultValue={editando?.nome} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Velocidade *</label>
                  <input type="text" name="velocidade" required defaultValue={editando?.velocidade} placeholder="ex: 100MB" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Velocidade Mbps *</label>
                  <input type="number" name="velocidade_mbps" required defaultValue={editando?.velocidade_mbps} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor Mensal *</label>
                  <input type="number" name="valor_mensal" step="0.01" required defaultValue={editando?.valor_mensal} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo *</label>
                  <select name="tipo_plano" defaultValue={editando?.tipo_plano || 'PADRAO'} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                    <option value="PADRAO">Padrão</option>
                    <option value="EMPRESARIAL">Empresarial</option>
                    <option value="RESIDENCIAL">Residencial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea name="descricao" defaultValue={editando?.descricao} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select name="ativo" defaultValue={editando ? String(editando.ativo) : 'true'} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={fecharModal} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
