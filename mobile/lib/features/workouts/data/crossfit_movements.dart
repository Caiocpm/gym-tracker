// lib/features/workouts/data/crossfit_movements.dart

class CrossfitMovementCategory {
  final String name;
  final String icon;
  final List<String> movements;
  const CrossfitMovementCategory({required this.name, required this.icon, required this.movements});
}

const crossfitMovementCategories = [
  CrossfitMovementCategory(
    name: 'Halterofilia',
    icon: '🏋️',
    movements: [
      'Clean', 'Power Clean', 'Hang Clean', 'Squat Clean', 'Clean & Jerk',
      'Snatch', 'Power Snatch', 'Hang Snatch', 'Overhead Squat',
      'Thruster', 'Push Press', 'Push Jerk', 'Split Jerk',
      'Deadlift', 'Romanian Deadlift', 'Sumo Deadlift High Pull',
      'Back Squat', 'Front Squat', 'Shoulder Press',
    ],
  ),
  CrossfitMovementCategory(
    name: 'Ginástica',
    icon: '🤸',
    movements: [
      'Pull-up', 'Kipping Pull-up', 'Butterfly Pull-up',
      'Chest-to-bar Pull-up', 'Muscle-up (Barra)', 'Muscle-up (Argola)',
      'Ring Dip', 'Handstand Push-up (HSPU)', 'Handstand Walk',
      'Toes-to-bar (TTB)', 'Knees-to-elbow', 'Push-up',
      'Box Jump', 'Box Jump Over', 'Box Step-up',
      'Double Under', 'Single Under', 'Pistol Squat',
      'Lunge', 'Walking Lunge',
    ],
  ),
  CrossfitMovementCategory(
    name: 'Cardio',
    icon: '🏃',
    movements: [
      'Corrida', 'Row (Remo)', 'Bike (Ciclismo)', 'Ski Erg',
      'Assault Bike', 'Echo Bike',
    ],
  ),
  CrossfitMovementCategory(
    name: 'Kettlebell / Halteres',
    icon: '🔔',
    movements: [
      'Kettlebell Swing (Russo)', 'Kettlebell Swing (Americano)',
      'Goblet Squat', 'Turkish Get-up',
      'Dumbbell Snatch', 'Dumbbell Clean', 'Dumbbell Thruster',
      'Devil Press', 'Man Maker', 'Dumbbell Deadlift',
    ],
  ),
  CrossfitMovementCategory(
    name: 'Funcionais',
    icon: '💪',
    movements: [
      'Burpee', 'Burpee Box Jump Over', 'Bar Facing Burpee',
      'Wall Ball', 'Wall Walk', 'Rope Climb',
      'Sit-up', 'GHD Sit-up', 'Back Extension',
      'Farmer Carry', 'Sandbag Carry', 'Atlas Stone',
    ],
  ),
];

/// Lista plana de todos os movimentos para busca rápida.
final List<String> allCrossfitMovements = crossfitMovementCategories
    .expand((c) => c.movements)
    .toList();
