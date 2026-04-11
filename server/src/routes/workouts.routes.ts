import { Router } from 'express';
import { workoutsController } from '../controllers/workouts.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeUser } from '../middleware/authorizeUser';
import { authorizeUserOrProfessional } from '../middleware/authorizeUserOrProfessional';
import { validate } from '../middleware/validate';
import {
  createWorkoutDaySchema,
  updateWorkoutDaySchema,
  addPlannedExerciseSchema,
  updatePlannedExerciseSchema,
  createWorkoutSessionSchema,
  updateWorkoutSessionSchema,
  createLoggedExerciseSchema,
  updateLoggedExerciseSchema,
} from '../schemas/workouts.schemas';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Workout Days — apenas o próprio usuário
router.get('/:userId/days', authorizeUser, workoutsController.listDays);
router.post('/:userId/days', authorizeUser, validate(createWorkoutDaySchema), workoutsController.createDay);
router.get('/:userId/days/:dayId', authorizeUser, workoutsController.getDay);
router.patch('/:userId/days/:dayId', authorizeUser, validate(updateWorkoutDaySchema), workoutsController.updateDay);
router.delete('/:userId/days/:dayId', authorizeUser, workoutsController.deleteDay);

// Planned Exercises — apenas o próprio usuário
router.post('/:userId/days/:dayId/exercises', authorizeUser, validate(addPlannedExerciseSchema), workoutsController.addExercise);
router.patch('/:userId/days/:dayId/exercises/:exerciseId', authorizeUser, validate(updatePlannedExerciseSchema), workoutsController.updateExercise);
router.delete('/:userId/days/:dayId/exercises/:exerciseId', authorizeUser, workoutsController.deleteExercise);

// Workout Sessions — leitura permite profissional vinculado; escrita/deleção apenas o próprio usuário
router.get('/:userId/sessions', authorizeUserOrProfessional, workoutsController.listSessions);
router.post('/:userId/sessions', authorizeUser, validate(createWorkoutSessionSchema), workoutsController.createSession);
router.get('/:userId/sessions/:sessionId', authorizeUserOrProfessional, workoutsController.getSession);
router.patch('/:userId/sessions/:sessionId', authorizeUser, validate(updateWorkoutSessionSchema), workoutsController.updateSession);
router.delete('/:userId/sessions/:sessionId', authorizeUser, workoutsController.deleteSession);

// Logged Exercises — leitura permite profissional vinculado; escrita/deleção apenas o próprio usuário
router.get('/:userId/logged-exercises', authorizeUserOrProfessional, workoutsController.listLogged);
router.post('/:userId/logged-exercises', authorizeUser, validate(createLoggedExerciseSchema), workoutsController.createLogged);
router.patch('/:userId/logged-exercises/:exerciseId', authorizeUser, validate(updateLoggedExerciseSchema), workoutsController.updateLogged);
router.delete('/:userId/logged-exercises/:exerciseId', authorizeUser, workoutsController.deleteLogged);

export default router;
