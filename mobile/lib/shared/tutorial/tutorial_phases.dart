// lib/shared/tutorial/tutorial_phases.dart
import 'package:flutter/material.dart';
import 'tutorial_step.dart';
import 'tutorial_keys.dart';

abstract class TutorialPhases {
  // ── Identificadores de fase ────────────────────────────────────────────────
  static const mainApp    = 'main_app';
  static const workoutDay = 'workout_day';
  static const nutrition  = 'nutrition';
  static const social     = 'social';
  static const analytics  = 'analytics';
  static const profile    = 'profile';

  // ── Fase 1: App principal (WorkoutsScreen) ─────────────────────────────────
  static List<TutorialStep> get mainAppSteps => [
    TutorialStep(
      id: 'bottom_nav',
      title: 'Navegação Principal',
      description:
          'Use as 5 abas para navegar entre Home, Treinos, Nutrição, Social '
          'e a última aba que varia conforme seu perfil.',
      targetKey: TutorialKeys.bottomNav,
      padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
      radius: 0,
      tooltipPosition: TooltipPosition.above,
    ),
    TutorialStep(
      id: 'profile_button',
      title: 'Seu Perfil',
      description:
          'Acesse seu dashboard, dados pessoais, medidas corporais, '
          'histórico de evolução e conquistas.',
      targetKey: TutorialKeys.profileButton,
      tooltipPosition: TooltipPosition.below,
    ),
    TutorialStep(
      id: 'notif_button',
      title: 'Notificações',
      description:
          'Fique por dentro das atividades dos seus grupos e conquistas desbloqueadas.',
      targetKey: TutorialKeys.notifButton,
      tooltipPosition: TooltipPosition.below,
    ),
    TutorialStep(
      id: 'workouts_header',
      title: 'Seus Treinos 💪',
      description:
          'Organize seus dias de treino por grupos musculares, cardio ou CrossFit '
          'e execute suas sessões.',
      targetKey: TutorialKeys.workoutsHeader,
      padding: const EdgeInsets.all(6),
      tooltipPosition: TooltipPosition.below,
    ),
    TutorialStep(
      id: 'add_workout',
      title: 'Criar Treino',
      description:
          'Toque aqui para criar um novo dia de treino. Você pode ter quantos quiser!',
      targetKey: TutorialKeys.addWorkoutButton,
      padding: const EdgeInsets.all(6),
      tooltipPosition: TooltipPosition.below,
    ),
  ];

  // ── Fase 1b: Dia de Treino ─────────────────────────────────────────────────
  static List<TutorialStep> get workoutDaySteps => [
    TutorialStep(
      id: 'workout_day_welcome',
      title: 'Seu Treino 🏋️',
      description:
          'Aqui você organiza os exercícios do dia, inicia suas séries e '
          'acompanha o progresso em tempo real.',
      targetKey: null, // welcome card centralizado
    ),
    TutorialStep(
      id: 'workout_day_fab',
      title: 'Adicionar Exercício',
      description:
          'Toque no + para buscar exercícios por nome ou grupo muscular. '
          'Você também pode criar exercícios personalizados.',
      targetKey: TutorialKeys.workoutDayFab,
      padding: const EdgeInsets.all(8),
      tooltipPosition: TooltipPosition.above,
    ),
    TutorialStep(
      id: 'workout_day_card',
      title: 'Iniciar Série 🚀',
      description:
          'Cada card mostra séries, repetições e carga sugerida. '
          'Toque em Iniciar para registrar seus sets e o cronômetro inicia automaticamente.',
      targetKey: TutorialKeys.workoutDayExerciseCard,
      padding: const EdgeInsets.all(6),
      tooltipPosition: TooltipPosition.below,
    ),
    TutorialStep(
      id: 'workout_day_finish',
      title: 'Finalizar e Salvar 🏆',
      description:
          'Ao concluir seus exercícios, o botão Finalizar aparece no topo da tela. '
          'Seu treino fica registrado nas Análises — você também pode desfazer se precisar.',
      targetKey: TutorialKeys.workoutDayFab,
      padding: const EdgeInsets.all(8),
      tooltipPosition: TooltipPosition.above,
    ),
  ];

  // ── Fase 2: Nutrição ───────────────────────────────────────────────────────
  static List<TutorialStep> get nutritionSteps => [
    TutorialStep(
      id: 'nutrition_header',
      title: 'Nutrição 🥗',
      description:
          'Acompanhe sua alimentação diária, macronutrientes e hidratação.',
      targetKey: TutorialKeys.nutritionHeader,
      padding: const EdgeInsets.all(6),
      tooltipPosition: TooltipPosition.below,
    ),
    TutorialStep(
      id: 'calories_card',
      title: 'Calorias & Macros',
      description:
          'Veja seu consumo de calorias, proteínas, carboidratos e gorduras '
          'em tempo real. Toque para adicionar um alimento.',
      targetKey: TutorialKeys.caloriesCard,
      padding: const EdgeInsets.all(6),
      tooltipPosition: TooltipPosition.below,
    ),
    TutorialStep(
      id: 'water_card',
      title: 'Hidratação 💧',
      description:
          'Registre sua ingestão de água ao longo do dia para se manter hidratado.',
      targetKey: TutorialKeys.waterCard,
      padding: const EdgeInsets.all(6),
      tooltipPosition: TooltipPosition.below,
    ),
    TutorialStep(
      id: 'weight_card',
      title: 'Peso Corporal ⚖️',
      description:
          'Registre seu peso regularmente para acompanhar sua evolução ao longo do tempo.',
      targetKey: TutorialKeys.weightCard,
      padding: const EdgeInsets.all(6),
      tooltipPosition: TooltipPosition.above,
    ),
    TutorialStep(
      id: 'nutrition_tabs',
      title: 'Abas de Nutrição 🗂️',
      description:
          'Visão Geral mostra seus macros do dia. '
          'Refeições permite registrar cada alimento por tipo de refeição. '
          'Metas define seus objetivos calóricos.',
      targetKey: TutorialKeys.nutritionTabBar,
      padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
      radius: 8,
      tooltipPosition: TooltipPosition.below,
    ),
  ];

  // ── Fase 3: Social ─────────────────────────────────────────────────────────
  static List<TutorialStep> get socialSteps => [
    TutorialStep(
      id: 'social_header',
      title: 'Comunidade 🤝',
      description:
          'Conecte-se com outros praticantes, crie grupos e compartilhe seu progresso.',
      targetKey: TutorialKeys.socialHeader,
      padding: const EdgeInsets.all(6),
      tooltipPosition: TooltipPosition.below,
    ),
    TutorialStep(
      id: 'social_tabs',
      title: 'Feed · Meus Grupos · Descobrir',
      description:
          'Navegue entre o feed de atividades, seus grupos e descubra novas '
          'comunidades para participar.',
      targetKey: TutorialKeys.socialTabs,
      padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
      radius: 8,
      tooltipPosition: TooltipPosition.below,
    ),
  ];

  // ── Fase 4: Análises ───────────────────────────────────────────────────────
  static List<TutorialStep> get analyticsSteps => [
    TutorialStep(
      id: 'analytics_tabbar',
      title: 'Análises 📊',
      description:
          'Visualize seu progresso em abas dedicadas: Geral, Nutrição, '
          'Musculação e Cardio — conforme as modalidades ativas.',
      targetKey: TutorialKeys.analyticsTabBar,
      padding: const EdgeInsets.all(4),
      radius: 8,
      tooltipPosition: TooltipPosition.below,
    ),
  ];

  // ── Fase 5: Perfil ─────────────────────────────────────────────────────────
  static List<TutorialStep> get profileSteps => [
    TutorialStep(
      id: 'profile_appbar',
      title: 'Seu Perfil 🏆',
      description:
          'Cinco abas completas: Dashboard com estatísticas, Dados Pessoais, '
          'Medidas corporais, Histórico de evolução e Conquistas.',
      targetKey: TutorialKeys.profileAppBar,
      padding: const EdgeInsets.all(4),
      tooltipPosition: TooltipPosition.below,
    ),
    TutorialStep(
      id: 'profile_settings',
      title: 'Configurações ⚙️',
      description:
          'Acesse as configurações pelo ícone ⚙️ no topo da tela. '
          'Personalize modalidades, timer de descanso, unidades de peso, '
          'notificações e aparência do app.',
      targetKey: null,
    ),
  ];
}
