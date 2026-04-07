// lib/shared/tutorial/tutorial_phases.dart
import 'package:flutter/material.dart';
import 'tutorial_step.dart';
import 'tutorial_keys.dart';

abstract class TutorialPhases {
  // ── Identificadores de fase ────────────────────────────────────────────────
  static const mainApp   = 'main_app';
  static const nutrition = 'nutrition';
  static const social    = 'social';
  static const analytics = 'analytics';
  static const profile   = 'profile';

  // ── Fase 1: App principal (WorkoutsScreen) ─────────────────────────────────
  static List<TutorialStep> get mainAppSteps => [
    TutorialStep(
      id: 'bottom_nav',
      title: 'Navegação Principal',
      description:
          'Use as 5 abas para acessar Home, Treinos, Nutrição, Social e Equipe.',
      targetKey: TutorialKeys.bottomNav,
      padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
      radius: 0,
      tooltipPosition: TooltipPosition.above,
    ),
    TutorialStep(
      id: 'profile_button',
      title: 'Seu Perfil',
      description:
          'Acesse estatísticas, conquistas, medidas corporais e configurações.',
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
  ];

  // ── Fase 3: Social ─────────────────────────────────────────────────────────
  static List<TutorialStep> get socialSteps => [
    TutorialStep(
      id: 'social_header',
      title: 'Comunidade 🤝',
      description:
          'Conecte-se com outros praticantes, crie grupos, participe de '
          'desafios e compartilhe seu progresso.',
      targetKey: TutorialKeys.socialHeader,
      padding: const EdgeInsets.all(6),
      tooltipPosition: TooltipPosition.below,
    ),
    TutorialStep(
      id: 'social_tabs',
      title: 'Feed · Grupos · Descobrir',
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
          'Visualize seu progresso, volume de treino, recordes pessoais, '
          'sequências e evolução de nutrição.',
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
          'Veja estatísticas gerais, conquistas desbloqueadas, medidas '
          'corporais e seu histórico de evolução.',
      targetKey: TutorialKeys.profileAppBar,
      padding: const EdgeInsets.all(4),
      tooltipPosition: TooltipPosition.below,
    ),
    TutorialStep(
      id: 'profile_settings',
      title: 'Configurações ⚙️',
      description:
          'Personalize modalidades ativas, timer de descanso, unidades de '
          'peso, notificações e aparência do app.',
      targetKey: TutorialKeys.profileSettingsBtn,
      tooltipPosition: TooltipPosition.below,
    ),
  ];
}
