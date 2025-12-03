import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfessional } from '../../hooks/useProfessional';
import { seedProfessionalData, clearProfessionalData } from '../../utils/seedProfessionalData';
import styles from './DevTools.module.css';

export function DevTools() {
  const { currentUser } = useAuth();
  const { professionalProfile, loadStudentLinks, loadPendingInvitations } = useProfessional();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSeedData = async () => {
    if (!currentUser) {
      setMessage({ type: 'error', text: 'Você precisa estar logado!' });
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);

      const result = await seedProfessionalData(currentUser.uid);

      // Recarregar dados
      await loadStudentLinks();
      await loadPendingInvitations();

      setMessage({
        type: 'success',
        text: `✅ Dados criados! ${result.studentLinks.length} alunos e ${result.invitationsCount} convites pendentes.`,
      });

      // Recarregar a página após 2 segundos para atualizar o contexto
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Erro ao popular dados:', error);
      setMessage({ type: 'error', text: '❌ Erro ao criar dados de teste' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Tem certeza que deseja limpar TODOS os dados profissionais?')) {
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);

      await clearProfessionalData();

      setMessage({ type: 'success', text: '✅ Dados profissionais limpos!' });

      // Recarregar a página após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      setMessage({ type: 'error', text: '❌ Erro ao limpar dados' });
    } finally {
      setIsLoading(false);
    }
  };

  // Só mostrar em desenvolvimento
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <div className={styles.devTools}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        title="Ferramentas de Desenvolvedor"
      >
        🛠️
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <h3>🛠️ Dev Tools</h3>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.section}>
              <h4>Área Profissional - Dados de Teste</h4>
              <p className={styles.description}>
                Cria um perfil profissional com 5 alunos vinculados e 2 convites pendentes.
              </p>

              {message && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                  {message.text}
                </div>
              )}

              <div className={styles.info}>
                <strong>Status:</strong>
                {professionalProfile ? (
                  <span className={styles.active}>✅ Perfil Profissional Ativo</span>
                ) : (
                  <span className={styles.inactive}>⚠️ Sem Perfil Profissional</span>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.seedButton}
                  onClick={handleSeedData}
                  disabled={isLoading}
                >
                  {isLoading ? 'Criando...' : '🌱 Criar Dados de Teste'}
                </button>

                <button
                  className={styles.clearButton}
                  onClick={handleClearData}
                  disabled={isLoading}
                >
                  {isLoading ? 'Limpando...' : '🗑️ Limpar Dados'}
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <h4>Informações</h4>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span>Usuário:</span>
                  <code>{currentUser?.email || 'Não logado'}</code>
                </div>
                <div className={styles.infoItem}>
                  <span>UID:</span>
                  <code>{currentUser?.uid || 'N/A'}</code>
                </div>
                <div className={styles.infoItem}>
                  <span>Modo:</span>
                  <code>{import.meta.env.MODE}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
