/**
 * permissao_usuario.js - Permissões por usuário
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PermissaoUsuario = sequelize.define('PermissaoUsuario', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id',
      },
    },
    recurso: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Ex: clientes, boletos, relatorios',
    },
    permissoes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['LEITURA'],
      comment: 'ARRAY DE PERMISSOES: LEITURA, ESCRITA, EXCLUSAO',
    },
    criado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'permissoes_usuario',
    timestamps: false,
    createdAt: 'criado_em',
    indexes: [
      { fields: ['usuario_id'] },
      { fields: ['recurso'] },
    ],
  });

  return PermissaoUsuario;
};
