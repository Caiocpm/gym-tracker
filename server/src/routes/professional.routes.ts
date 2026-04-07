import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { professionalController } from '../controllers/professional.controller';
import { authenticate } from '../middleware/authenticate';

const logoUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../../uploads/logos'),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    cb(null, allowed.includes(file.mimetype));
  },
});
import { validate } from '../middleware/validate';
import { requirePlan } from '../middleware/requirePlan';
import {
  createProfileSchema,
  updateProfileSchema,
  createTagSchema,
  createInvitationSchema,
  acceptInvitationSchema,
  createNoteSchema,
  updateNoteSchema,
  createGoalSchema,
  updateGoalSchema,
  createEvaluationSchema,
  updateEvaluationSchema,
  createConversationSchema,
  addMessageSchema,
  markAsReadSchema,
} from '../schemas/professional.schemas';

const router = Router();

router.use(authenticate);

// ─── Profile ─────────────────────────────────────────────────────────────────
router.post('/profile', validate(createProfileSchema), professionalController.createProfile);
router.get('/profile/:userId', professionalController.getProfile);
router.patch('/profile/:userId', validate(updateProfileSchema), professionalController.updateProfile);

// ─── Tags ─────────────────────────────────────────────────────────────────────
router.get('/tags', professionalController.listTags);
router.post('/tags', validate(createTagSchema), professionalController.createTag);
router.delete('/tags/:tagId', professionalController.deleteTag);

// ─── Student-side: aluno vê seus próprios vínculos ────────────────────────────
router.get('/student/links', professionalController.listMyLinks);
router.delete('/student/links/:linkId', professionalController.unlinkSelf);
router.get('/student/links/:linkId/goals',         professionalController.listStudentGoals);
router.get('/student/links/:linkId/evaluations',   professionalController.listStudentEvaluations);
router.get('/student/links/:linkId/conversations', professionalController.listStudentConversations);
router.get('/student/conversations/:conversationId',              professionalController.getStudentConversation);
router.post('/student/conversations/:conversationId/messages',    professionalController.addStudentMessage);
router.post('/student/conversations/:conversationId/read',        professionalController.markStudentConversationRead);

// ─── Students ─────────────────────────────────────────────────────────────────
router.get('/students', professionalController.listStudents);
router.get('/students/:linkId', professionalController.getStudent);
router.patch('/students/:linkId', professionalController.updateStudent);
router.post('/students/:linkId/renew-plan', professionalController.renewStudentPlan);
router.get('/students/:linkId/consistency', professionalController.getStudentConsistency);
router.delete('/students/:linkId', professionalController.unlinkStudent);
router.delete('/students/:linkId/full', professionalController.deleteStudent);
router.post('/students/:linkId/tags', professionalController.addTagToStudent);
router.delete('/students/:linkId/tags/:tagId', professionalController.removeTagFromStudent);

// ─── Student data read (plan-gated) ──────────────────────────────────────────
router.get('/students/:linkId/workouts',            requirePlan('workouts'), professionalController.getStudentWorkouts);
router.get('/students/:linkId/workouts/analytics',  requirePlan('workouts'), professionalController.getStudentWorkoutAnalytics);
router.get('/students/:linkId/nutrition',           requirePlan('nutrition'), professionalController.getStudentNutrition);
router.get('/students/:linkId/goals',      professionalController.getStudentGoals);

// ─── Workout builder (professional → student) ────────────────────────────────
router.post(  '/students/:linkId/workouts/days',                   requirePlan('workouts'), professionalController.createStudentWorkoutDay);
router.patch( '/students/:linkId/workouts/days/:dayId',            requirePlan('workouts'), professionalController.updateStudentWorkoutDay);
router.delete('/students/:linkId/workouts/days/:dayId',            requirePlan('workouts'), professionalController.deleteStudentWorkoutDay);
router.post(  '/students/:linkId/workouts/days/:dayId/exercises',  requirePlan('workouts'), professionalController.addStudentWorkoutExercise);
router.delete('/students/:linkId/workouts/days/:dayId/exercises/:exId', requirePlan('workouts'), professionalController.deleteStudentWorkoutExercise);

// ─── Diet builder (professional → student) ───────────────────────────────────
router.get(   '/students/:linkId/diet-plan',          requirePlan('nutrition'), professionalController.getStudentDietPlan);
router.post(  '/students/:linkId/diet-plan',          requirePlan('nutrition'), professionalController.createStudentDietPlanItem);
router.delete('/students/:linkId/diet-plan/:itemId',  requirePlan('nutrition'), professionalController.deleteStudentDietPlanItem);
router.patch( '/students/:linkId/nutrition-goals',    requirePlan('nutrition'), professionalController.updateStudentNutritionGoals);

// ─── Resource search ──────────────────────────────────────────────────────────
router.get('/resources/exercises', professionalController.searchExercises);
router.get('/resources/foods',     professionalController.searchFoods);

// ─── Invitations ──────────────────────────────────────────────────────────────
router.get('/invitations', professionalController.listInvitations);
router.post('/invitations', validate(createInvitationSchema), professionalController.createInvitation);
router.get('/invitations/:code/preview', professionalController.getInvitationPreview);
router.post('/invitations/:code/accept', validate(acceptInvitationSchema), professionalController.acceptInvitation);
router.post('/invitations/:invitationId/reject', professionalController.rejectInvitation);

// ─── Notes ───────────────────────────────────────────────────────────────────
router.get('/notes', professionalController.listNotes);
router.post('/notes', validate(createNoteSchema), professionalController.createNote);
router.patch('/notes/:noteId', validate(updateNoteSchema), professionalController.updateNote);
router.delete('/notes/:noteId', professionalController.deleteNote);

// ─── Goals ───────────────────────────────────────────────────────────────────
router.get('/goals', professionalController.listGoals);
router.post('/goals', validate(createGoalSchema), professionalController.createGoal);
router.patch('/goals/:goalId', validate(updateGoalSchema), professionalController.updateGoal);
router.delete('/goals/:goalId', professionalController.deleteGoal);

// ─── Evaluations ─────────────────────────────────────────────────────────────
router.get('/evaluations', professionalController.listEvaluations);
router.post('/evaluations', validate(createEvaluationSchema), professionalController.createEvaluation);
router.patch('/evaluations/:evaluationId', validate(updateEvaluationSchema), professionalController.updateEvaluation);
router.delete('/evaluations/:evaluationId', professionalController.deleteEvaluation);

// ─── Stats ───────────────────────────────────────────────────────────────────
router.get('/stats', professionalController.getStats);

// ─── Collaborations ───────────────────────────────────────────────────────────
router.get( '/students/:linkId/collaborators',               professionalController.listCollaborators);
router.post('/students/:linkId/collaborators',               professionalController.inviteCollaborator);
router.delete('/students/:linkId/collaborators/:collabId',   professionalController.removeCollaborator);
router.get( '/collaborations',                               professionalController.listReceivedCollaborations);
router.post('/collaborations/:collabId/respond',             professionalController.respondToCollaboration);

// ─── Conversations ────────────────────────────────────────────────────────────
router.get('/conversations', professionalController.listConversations);
router.post('/conversations', validate(createConversationSchema), professionalController.createConversation);
router.get('/conversations/:conversationId', professionalController.getConversation);
router.post('/conversations/:conversationId/messages', validate(addMessageSchema), professionalController.addMessage);
router.post('/conversations/:conversationId/read', validate(markAsReadSchema), professionalController.markAsRead);
router.post('/conversations/:conversationId/archive', professionalController.archiveConversation);
router.post('/conversations/:conversationId/unarchive', professionalController.unarchiveConversation);
router.delete('/conversations/:conversationId', professionalController.deleteConversation);

// ─── Brand (PRO plan) ────────────────────────────────────────────────────────
router.get('/brand', professionalController.getBrand);
router.patch('/brand', professionalController.updateBrand);
router.post('/brand/logo', logoUpload.single('logo'), professionalController.uploadLogo);

// ─── Professional updates ─────────────────────────────────────────────────────
router.get('/updates', professionalController.listMyUpdates);
router.post('/updates', professionalController.createUpdate);
router.delete('/updates/:updateId', professionalController.deleteUpdate);
router.get('/student/updates', professionalController.getStudentProfessionalUpdates);

export default router;
