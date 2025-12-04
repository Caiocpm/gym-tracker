import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useProfessional } from '../../hooks/useProfessional';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ProfessionalAccess.module.css';

export function ProfessionalAccess() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    isProfessional,
    isInProfessionalMode,
    professionalProfile,
    studentLinks,
    activeSession,
    switchToStudent,
    switchToPersonalMode,
    switchToProfessionalMode,
  } = useProfessional();
  const { currentUser } = useAuth();

  // Calcular posição do dropdown baseado na posição do botão
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;

      // Em mobile (≤480px), posicionar acima do botão
      if (windowWidth <= 480) {
        // Altura estimada do dropdown (400px max-height + padding)
        const dropdownHeight = 410;

        // Calcular top para que o dropdown fique acima do botão
        // Se não houver espaço suficiente acima, ajustar para ficar visível
        let calculatedTop = buttonRect.top - dropdownHeight - 10;

        // Se for muito acima (negativo ou muito próximo do topo), ajustar
        if (calculatedTop < 10) {
          calculatedTop = 10;
        }

        setDropdownPosition({
          top: calculatedTop,
          right: 10
        });
      } else {
        // Em tablet/desktop, posicionar abaixo do botão
        setDropdownPosition({
          top: buttonRect.bottom + 8,
          right: window.innerWidth - buttonRect.right
        });
      }
    }
  }, [isOpen]);

  // Limpar busca quando o dropdown é fechado
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Fechar dropdown com tecla ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen]);

  if (!currentUser) return null;

  // Filtrar alunos com base no termo de busca
  const filteredStudents = studentLinks.filter((link) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      link.studentName?.toLowerCase().includes(searchLower) ||
      link.studentEmail?.toLowerCase().includes(searchLower)
    );
  });

  // Se não é profissional, mostrar botão para se tornar profissional
  if (!isProfessional) {
    return (
      <div className={styles.professionalAccessContainer}>
        <Link to="/professional-signup" className={styles.becomeProfessionalButton}>
          <span className={styles.icon}>👨‍⚕️</span>
          <span>Área Profissional</span>
        </Link>
      </div>
    );
  }

  // Se é profissional, mostrar dropdown com opções
  return (
    <div className={styles.professionalAccessContainer}>
      <button
        ref={buttonRef}
        className={`${styles.professionalButton} ${isInProfessionalMode ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.icon}>👨‍⚕️</span>
        <span className={styles.label}>
          {isInProfessionalMode && activeSession?.activeStudentName
            ? `Aluno: ${activeSession.activeStudentName}`
            : 'Área Profissional'}
        </span>
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && createPortal(
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />

          <div
            className={styles.dropdown}
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`
            }}
          >
            <div className={styles.dropdownHeader}>
              <div className={styles.professionalInfo}>
                <div className={styles.professionalName}>
                  {professionalProfile?.displayName}
                </div>
                <div className={styles.professionalType}>
                  {professionalProfile?.professionalType === 'personal_trainer' && 'Personal Trainer'}
                  {professionalProfile?.professionalType === 'nutricionista' && 'Nutricionista'}
                  {professionalProfile?.professionalType === 'fisioterapeuta' && 'Fisioterapeuta'}
                  {professionalProfile?.professionalType === 'preparador_fisico' && 'Preparador Físico'}
                  {professionalProfile?.professionalType === 'outro' && 'Profissional'}
                </div>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className={styles.dropdownDivider} />

            {/* Modo Pessoal */}
            <button
              className={`${styles.dropdownItem} ${!isInProfessionalMode ? styles.itemActive : ''}`}
              onClick={() => {
                switchToPersonalMode();
                setIsOpen(false);
              }}
            >
              <span className={styles.itemIcon}>👤</span>
              <span>Meu Perfil Pessoal</span>
              {!isInProfessionalMode && <span className={styles.checkmark}>✓</span>}
            </button>

            {/* Modo Profissional - Sem aluno selecionado */}
            <button
              className={`${styles.dropdownItem} ${isInProfessionalMode && !activeSession?.activeStudentId ? styles.itemActive : ''}`}
              onClick={() => {
                switchToProfessionalMode();
                setIsOpen(false);
              }}
            >
              <span className={styles.itemIcon}>📋</span>
              <span>Dashboard Profissional</span>
              {isInProfessionalMode && !activeSession?.activeStudentId && <span className={styles.checkmark}>✓</span>}
            </button>

            <div className={styles.dropdownDivider} />

            {/* Lista de Alunos */}
            <div className={styles.studentsSection}>
              <div className={styles.studentsSectionTitle}>
                Meus Alunos ({studentLinks.length})
              </div>

              {/* Debug: Sempre mostrar busca para teste */}
              {studentLinks.length > 0 && (
                <div className={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="Buscar aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {searchTerm && (
                    <button
                      className={styles.clearSearch}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchTerm('');
                      }}
                      title="Limpar busca"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              {studentLinks.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Nenhum aluno vinculado</p>
                  <small>Convide alunos pelo dashboard</small>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Nenhum aluno encontrado</p>
                  <small>Tente outro termo de busca</small>
                </div>
              ) : (
                <div className={styles.studentsList}>
                  {filteredStudents.map((link) => (
                    <button
                      key={link.id}
                      className={`${styles.studentItem} ${
                        activeSession?.activeStudentId === link.studentUserId
                          ? styles.studentActive
                          : ''
                      }`}
                      onClick={() => {
                        switchToStudent(link.studentUserId);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      <div className={styles.studentInfo}>
                        <div className={styles.studentName}>
                          {link.studentName || link.studentEmail}
                        </div>
                        <div className={styles.studentEmail}>
                          {link.studentEmail}
                        </div>
                      </div>
                      {activeSession?.activeStudentId === link.studentUserId && (
                        <span className={styles.checkmark}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
