// src/components/IndexedDBDemo/IndexedDBDemo.tsx
// Componente de demonstração do IndexedDB

import { useState, useEffect } from 'react';
import { useWorkoutDB } from '../../db/hooks/useWorkoutDB';
import { useNutritionDB } from '../../db/hooks/useNutritionDB';
import {
  migrateFromLocalStorage,
  getMigrationStatus,
  clearLocalStorageBackup,
} from '../../db/migrations';
import { getDatabaseStats, exportAllData } from '../../db/database';

/**
 * 🎯 COMPONENTE DE DEMONSTRAÇÃO E GERENCIAMENTO DO INDEXEDDB
 *
 * Este componente mostra:
 * 1. Como usar os hooks do IndexedDB
 * 2. Status da migração
 * 3. Estatísticas do banco
 * 4. Ferramentas de backup/restore
 */

export function IndexedDBDemo() {
  // Estados
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // Hooks do IndexedDB
  const { workoutDays, isLoading: workoutLoading } = useWorkoutDB();
  const { recentFoodEntries, isLoading: nutritionLoading } = useNutritionDB();

  // Carregar status ao montar
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const status = await getMigrationStatus();
    const stats = await getDatabaseStats();

    setMigrationStatus(status);
    setDbStats(stats);
  };

  // ============================================================================
  //                          AÇÕES
  // ============================================================================

  const handleMigration = async () => {
    if (!confirm('Migrar dados do localStorage para IndexedDB?')) return;

    setIsMigrating(true);
    try {
      const result = await migrateFromLocalStorage();

      if (result.success) {
        alert(
          `✅ Migração concluída!\n\n${result.migratedItems} itens migrados com sucesso.`
        );
      } else {
        alert(
          `⚠️ Migração concluída com erros:\n\n${result.errors.join('\n')}`
        );
      }

      await loadStatus();
    } catch (error) {
      alert(`❌ Erro na migração: ${error}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();

      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `gymtracker-indexeddb-backup-${
        new Date().toISOString().split('T')[0]
      }.json`;
      link.click();

      URL.revokeObjectURL(url);
      alert('✅ Backup exportado com sucesso!');
    } catch (error) {
      alert(`❌ Erro ao exportar: ${error}`);
    }
  };

  const handleClearLocalStorage = async () => {
    await clearLocalStorageBackup();
    await loadStatus();
  };

  // ============================================================================
  //                          RENDERIZAÇÃO
  // ============================================================================

  // Mostrar conteúdo mesmo se estiver carregando (para ver o botão de migração)
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🗄️ Gerenciamento IndexedDB</h2>

      {(workoutLoading || nutritionLoading) && (
        <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '8px', marginBottom: '20px' }}>
          <p style={{ margin: 0 }}>⏳ Carregando dados do IndexedDB...</p>
        </div>
      )}

      {/* STATUS DA MIGRAÇÃO */}
      <section style={{ marginBottom: '30px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>📊 Status da Migração</h3>

        {migrationStatus?.completed ? (
          <div style={{ color: 'green' }}>
            <p>
              ✅ Migração concluída em{' '}
              {new Date(migrationStatus.migrationDate).toLocaleString('pt-BR')}
            </p>
            <p>📦 Itens migrados: {migrationStatus.migratedItems}</p>
            <p>
              💾 Backup no localStorage:{' '}
              {migrationStatus.hasLocalStorageBackup ? '✅ Existe' : '❌ Removido'}
            </p>

            {migrationStatus.hasLocalStorageBackup && (
              <button
                onClick={handleClearLocalStorage}
                style={{
                  marginTop: '10px',
                  padding: '10px 20px',
                  background: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                🗑️ Limpar Backup do localStorage
              </button>
            )}
          </div>
        ) : (
          <div style={{ color: 'orange' }}>
            <p>⚠️ Migração ainda não foi realizada</p>
            <button
              onClick={handleMigration}
              disabled={isMigrating}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isMigrating ? 'not-allowed' : 'pointer',
                opacity: isMigrating ? 0.6 : 1,
              }}
            >
              {isMigrating ? '⏳ Migrando...' : '🔄 Iniciar Migração'}
            </button>
          </div>
        )}
      </section>

      {/* ESTATÍSTICAS DO BANCO */}
      <section style={{ marginBottom: '30px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>📈 Estatísticas do Banco</h3>

        {dbStats && (
          <div>
            <p>📊 Total de registros: {dbStats.totalRecords}</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>🏋️ Dias de treino: {dbStats.workoutDaysCount}</li>
              <li>📝 Sessões de treino: {dbStats.workoutSessionsCount}</li>
              <li>💪 Exercícios logados: {dbStats.loggedExercisesCount}</li>
              <li>🍎 Entradas de comida: {dbStats.foodEntriesCount}</li>
              <li>💧 Entradas de água: {dbStats.waterEntriesCount}</li>
              <li>📏 Medições corporais: {dbStats.measurementsCount}</li>
            </ul>
          </div>
        )}

        <button
          onClick={loadStatus}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          🔄 Atualizar Estatísticas
        </button>
      </section>

      {/* EXEMPLO DE DADOS REATIVOS */}
      <section style={{ marginBottom: '30px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>🔴 Dados em Tempo Real (Live Query)</h3>

        <div>
          <h4>🏋️ Dias de Treino ({workoutDays?.length || 0})</h4>
          <ul style={{ maxHeight: '150px', overflow: 'auto' }}>
            {workoutDays?.map((day) => (
              <li key={day.id}>
                {day.name} - {day.exercises.length} exercícios
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: '15px' }}>
          <h4>🍎 Refeições Recentes ({recentFoodEntries?.length || 0})</h4>
          <ul style={{ maxHeight: '150px', overflow: 'auto' }}>
            {recentFoodEntries?.slice(0, 10).map((entry) => (
              <li key={entry.id}>
                {entry.date} - {entry.name} ({entry.calories} kcal)
              </li>
            ))}
          </ul>
        </div>

        <p style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
          💡 <strong>Dica:</strong> Esses dados atualizam AUTOMATICAMENTE quando
          você adiciona/remove itens!
        </p>
      </section>

      {/* FERRAMENTAS */}
      <section style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>🛠️ Ferramentas</h3>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            📤 Exportar Backup (IndexedDB)
          </button>
        </div>

        <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '5px' }}>
          <p style={{ margin: 0, fontSize: '0.9em' }}>
            ℹ️ <strong>Importante:</strong> Sempre mantenha backups atualizados
            dos seus dados!
          </p>
        </div>
      </section>

      {/* COMPARAÇÃO VISUAL */}
      <section style={{ marginTop: '30px', padding: '15px', background: '#e8f5e9', borderRadius: '8px' }}>
        <h3>✨ Vantagens do IndexedDB</h3>
        <ul>
          <li>✅ <strong>Maior capacidade:</strong> 50MB - 1GB+ (vs 5-10MB do localStorage)</li>
          <li>✅ <strong>Não bloqueia a UI:</strong> Operações assíncronas</li>
          <li>✅ <strong>Busca rápida:</strong> Índices para queries eficientes</li>
          <li>✅ <strong>Atualização automática:</strong> Live queries (useLiveQuery)</li>
          <li>✅ <strong>Transações:</strong> Garante integridade dos dados</li>
          <li>✅ <strong>Estruturado:</strong> Armazena objetos diretamente</li>
        </ul>
      </section>
    </div>
  );
}
