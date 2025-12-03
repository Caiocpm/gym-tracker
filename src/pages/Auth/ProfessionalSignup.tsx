import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfessional } from '../../hooks/useProfessional';
import type { ProfessionalType } from '../../types/professional';
import styles from './Auth.module.css';

const PROFESSIONAL_TYPES: { value: ProfessionalType; label: string }[] = [
  { value: 'personal_trainer', label: 'Personal Trainer' },
  { value: 'nutricionista', label: 'Nutricionista' },
  { value: 'fisioterapeuta', label: 'Fisioterapeuta' },
  { value: 'preparador_fisico', label: 'Preparador Físico' },
  { value: 'outro', label: 'Outro' },
];

const SPECIALTIES_OPTIONS = [
  'Hipertrofia',
  'Emagrecimento',
  'Condicionamento',
  'Reabilitação',
  'Idosos',
  'Gestantes',
  'Atletas',
  'Iniciantes',
];

export default function ProfessionalSignup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    professionalType: 'personal_trainer' as ProfessionalType,
    cref: '',
    crn: '',
    crefito: '',
    phone: '',
  });
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { registerAsProfessional } = useProfessional();
  const navigate = useNavigate();

  function handleSpecialtyToggle(specialty: string) {
    setSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Validações
    if (!formData.email || !formData.password || !formData.displayName) {
      return setError('Por favor, preencha todos os campos obrigatórios');
    }

    if (formData.password.length < 6) {
      return setError('A senha deve ter pelo menos 6 caracteres');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('As senhas não coincidem');
    }

    if (specialties.length === 0) {
      return setError('Selecione pelo menos uma especialidade');
    }

    // Validar registro profissional baseado no tipo
    if (formData.professionalType === 'personal_trainer' && !formData.cref) {
      return setError('CREF é obrigatório para Personal Trainers');
    }

    if (formData.professionalType === 'nutricionista' && !formData.crn) {
      return setError('CRN é obrigatório para Nutricionistas');
    }

    if (formData.professionalType === 'fisioterapeuta' && !formData.crefito) {
      return setError('CREFITO é obrigatório para Fisioterapeutas');
    }

    try {
      setError('');
      setLoading(true);

      // 1. Criar conta de usuário comum
      await signup(formData.email, formData.password, formData.displayName);

      // 2. Registrar como profissional
      await registerAsProfessional({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        professionalType: formData.professionalType,
        specialties,
        cref: formData.cref || undefined,
        crn: formData.crn || undefined,
        crefito: formData.crefito || undefined,
        phone: formData.phone || undefined,
      });

      navigate('/');
    } catch (err: any) {
      console.error('Erro ao criar conta profissional:', err);

      if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido');
      } else if (err.code === 'auth/weak-password') {
        setError('Senha muito fraca');
      } else {
        setError('Falha ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard} style={{ maxWidth: '600px' }}>
        <div className={styles.authHeader}>
          <h1>Área Profissional</h1>
          <p>Crie sua conta profissional e gerencie seus alunos</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {/* Informações Básicas */}
          <div className={styles.formSection}>
            <h3>Informações Básicas</h3>

            <div className={styles.formGroup}>
              <label htmlFor="displayName">Nome Completo *</label>
              <input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Seu nome completo"
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Telefone</label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Senha *</label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirmar Senha *</label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Informações Profissionais */}
          <div className={styles.formSection}>
            <h3>Informações Profissionais</h3>

            <div className={styles.formGroup}>
              <label htmlFor="professionalType">Tipo de Profissional *</label>
              <select
                id="professionalType"
                value={formData.professionalType}
                onChange={(e) => setFormData({ ...formData, professionalType: e.target.value as ProfessionalType })}
                disabled={loading}
                required
              >
                {PROFESSIONAL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Registro Profissional */}
            {formData.professionalType === 'personal_trainer' && (
              <div className={styles.formGroup}>
                <label htmlFor="cref">CREF *</label>
                <input
                  id="cref"
                  type="text"
                  value={formData.cref}
                  onChange={(e) => setFormData({ ...formData, cref: e.target.value })}
                  placeholder="000000-G/XX"
                  disabled={loading}
                  required
                />
              </div>
            )}

            {formData.professionalType === 'nutricionista' && (
              <div className={styles.formGroup}>
                <label htmlFor="crn">CRN *</label>
                <input
                  id="crn"
                  type="text"
                  value={formData.crn}
                  onChange={(e) => setFormData({ ...formData, crn: e.target.value })}
                  placeholder="0000000"
                  disabled={loading}
                  required
                />
              </div>
            )}

            {formData.professionalType === 'fisioterapeuta' && (
              <div className={styles.formGroup}>
                <label htmlFor="crefito">CREFITO *</label>
                <input
                  id="crefito"
                  type="text"
                  value={formData.crefito}
                  onChange={(e) => setFormData({ ...formData, crefito: e.target.value })}
                  placeholder="000000-F"
                  disabled={loading}
                  required
                />
              </div>
            )}

            {/* Especialidades */}
            <div className={styles.formGroup}>
              <label>Especialidades *</label>
              <div className={styles.checkboxGroup}>
                {SPECIALTIES_OPTIONS.map((specialty) => (
                  <label key={specialty} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={specialties.includes(specialty)}
                      onChange={() => handleSpecialtyToggle(specialty)}
                      disabled={loading}
                    />
                    <span>{specialty}</span>
                  </label>
                ))}
              </div>
              {specialties.length > 0 && (
                <small className={styles.formHint}>
                  Selecionadas: {specialties.join(', ')}
                </small>
              )}
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar Conta Profissional'}
          </button>
        </form>

        <div className={styles.authFooter}>
          <p>
            Já tem uma conta? <Link to="/login">Entrar</Link>
          </p>
          <p>
            <Link to="/signup">Criar conta de usuário comum</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
