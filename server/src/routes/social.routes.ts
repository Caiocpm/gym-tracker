import { Router } from 'express';
import { socialController } from '../controllers/social.controller';
import { wodsController } from '../controllers/wods.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  createGroupSchema,
  updateGroupSchema,
  createPostSchema,
  addCommentSchema,
  createChallengeSchema,
  updateProgressSchema,
} from '../schemas/social.schemas';

const router = Router();
router.use(authenticate);

// ─── Groups ───────────────────────────────────────────────────────────────────
router.get('/groups', socialController.listGroups);
router.post('/groups', validate(createGroupSchema), socialController.createGroup);
router.get('/groups/:groupId', socialController.getGroup);
router.get('/groups/:groupId/members', socialController.listGroupMembers);
router.patch('/groups/:groupId', validate(updateGroupSchema), socialController.updateGroup);
router.delete('/groups/:groupId', socialController.deleteGroup);
router.post('/groups/join-by-code', socialController.joinGroupByCode);
router.post('/groups/:groupId/join', socialController.joinGroup);
router.post('/groups/:groupId/leave', socialController.leaveGroup);

// ─── Posts ────────────────────────────────────────────────────────────────────
router.get('/groups/:groupId/posts', socialController.listPosts);
router.post('/groups/:groupId/posts', validate(createPostSchema), socialController.createPost);
router.delete('/posts/:postId', socialController.deletePost);
router.post('/posts/:postId/like', socialController.likePost);
router.delete('/posts/:postId/like', socialController.unlikePost);
router.post('/posts/:postId/comments', validate(addCommentSchema), socialController.addComment);
router.delete('/comments/:commentId', socialController.deleteComment);

// ─── WODs do grupo ────────────────────────────────────────────────────────────
router.get('/groups/:groupId/wods', wodsController.listByGroup);

// ─── Challenges ───────────────────────────────────────────────────────────────
router.get('/groups/:groupId/challenges', socialController.listChallenges);
router.post('/groups/:groupId/challenges', validate(createChallengeSchema), socialController.createChallenge);
router.post('/challenges/:challengeId/join', socialController.joinChallenge);
router.patch('/challenges/:challengeId/progress', validate(updateProgressSchema), socialController.updateChallengeProgress);

// ─── Badges ───────────────────────────────────────────────────────────────────
router.get('/badges', socialController.listBadges);

// ─── User Stats / Profile ─────────────────────────────────────────────────────
router.get('/stats', socialController.getUserStats);
router.get('/users/:userId/profile', socialController.getUserPublicProfile);

// ─── Follow ───────────────────────────────────────────────────────────────────
router.post('/users/:userId/follow', socialController.followUser);
router.delete('/users/:userId/follow', socialController.unfollowUser);

// ─── Feed ─────────────────────────────────────────────────────────────────────
router.get('/feed', socialController.getFeed);
router.get('/feed/discover', socialController.getDiscoverFeed);
router.post('/feed/posts', validate(createPostSchema), socialController.createFeedPost);

export default router;
