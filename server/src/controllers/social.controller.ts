import type { Request, Response, NextFunction } from 'express';
import { socialService } from '../services/social.service';

export const socialController = {
  // ─── Groups ─────────────────────────────────────────────────────────────────

  async listGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = req.query.filter as 'my' | 'discover' | undefined;
      const groups = await socialService.listGroups(req.user!.uid, filter);
      res.json({ data: groups });
    } catch (err) { next(err); }
  },

  async getGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await socialService.getGroup(req.params.groupId);
      res.json({ data: group });
    } catch (err) { next(err); }
  },

  async createGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await socialService.createGroup(req.user!.uid, req.body);
      res.status(201).json({ data: group });
    } catch (err) { next(err); }
  },

  async updateGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await socialService.updateGroup(req.params.groupId, req.user!.uid, req.body);
      res.json({ data: group });
    } catch (err) { next(err); }
  },

  async deleteGroup(req: Request, res: Response, next: NextFunction) {
    try {
      await socialService.deleteGroup(req.params.groupId, req.user!.uid);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async listGroupMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const members = await socialService.listGroupMembers(req.params.groupId);
      res.json({ data: members });
    } catch (err) { next(err); }
  },

  async joinGroup(req: Request, res: Response, next: NextFunction) {
    try {
      await socialService.joinGroup(req.params.groupId, req.user!.uid);
      res.status(201).json({ message: 'Entrou no grupo com sucesso' });
    } catch (err) { next(err); }
  },

  async joinGroupByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { inviteCode } = req.body as { inviteCode: string };
      const group = await socialService.joinGroupByCode(inviteCode, req.user!.uid);
      res.status(201).json({ data: group });
    } catch (err) { next(err); }
  },

  async leaveGroup(req: Request, res: Response, next: NextFunction) {
    try {
      await socialService.leaveGroup(req.params.groupId, req.user!.uid);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Posts ──────────────────────────────────────────────────────────────────

  async listPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const posts = await socialService.listPosts(req.params.groupId, req.user!.uid);
      res.json({ data: posts });
    } catch (err) { next(err); }
  },

  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await socialService.createPost(req.params.groupId, req.user!.uid, req.body);
      res.status(201).json({ data: post });
    } catch (err) { next(err); }
  },

  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      await socialService.deletePost(req.params.postId, req.user!.uid);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async likePost(req: Request, res: Response, next: NextFunction) {
    try {
      await socialService.likePost(req.params.postId, req.user!.uid);
      res.status(201).json({ message: 'Post curtido' });
    } catch (err) { next(err); }
  },

  async unlikePost(req: Request, res: Response, next: NextFunction) {
    try {
      await socialService.unlikePost(req.params.postId, req.user!.uid);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await socialService.addComment(req.params.postId, req.user!.uid, req.body.text);
      res.status(201).json({ data: comment });
    } catch (err) { next(err); }
  },

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      await socialService.deleteComment(req.params.commentId, req.user!.uid);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Challenges ─────────────────────────────────────────────────────────────

  async listChallenges(req: Request, res: Response, next: NextFunction) {
    try {
      const challenges = await socialService.listChallenges(req.params.groupId, req.user!.uid);
      res.json({ data: challenges });
    } catch (err) { next(err); }
  },

  async createChallenge(req: Request, res: Response, next: NextFunction) {
    try {
      const challenge = await socialService.createChallenge(
        req.params.groupId,
        req.user!.uid,
        req.body
      );
      res.status(201).json({ data: challenge });
    } catch (err) { next(err); }
  },

  async joinChallenge(req: Request, res: Response, next: NextFunction) {
    try {
      await socialService.joinChallenge(req.params.challengeId, req.user!.uid);
      res.status(201).json({ message: 'Entrou no desafio' });
    } catch (err) { next(err); }
  },

  async updateChallengeProgress(req: Request, res: Response, next: NextFunction) {
    try {
      await socialService.updateChallengeProgress(
        req.params.challengeId,
        req.user!.uid,
        req.body.progress
      );
      res.json({ message: 'Progresso atualizado' });
    } catch (err) { next(err); }
  },

  // ─── Badges ─────────────────────────────────────────────────────────────────

  async listBadges(req: Request, res: Response, next: NextFunction) {
    try {
      const badges = await socialService.listBadges(req.user!.uid);
      res.json({ data: badges });
    } catch (err) { next(err); }
  },

  // ─── User Stats / Profile ────────────────────────────────────────────────────

  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await socialService.getUserStats(req.user!.uid);
      res.json({ data: stats });
    } catch (err) { next(err); }
  },

  async getUserPublicProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await socialService.getUserPublicProfile(req.params.userId, req.user!.uid);
      res.json({ data: profile });
    } catch (err) { next(err); }
  },

  // ─── Follow ─────────────────────────────────────────────────────────────────

  async followUser(req: Request, res: Response, next: NextFunction) {
    try {
      await socialService.followUser(req.user!.uid, req.params.userId);
      res.status(201).json({ message: 'Seguindo' });
    } catch (err) { next(err); }
  },

  async unfollowUser(req: Request, res: Response, next: NextFunction) {
    try {
      await socialService.unfollowUser(req.user!.uid, req.params.userId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Feed ───────────────────────────────────────────────────────────────────

  async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const posts = await socialService.getFeed(req.user!.uid, page, limit);
      res.json({ data: posts });
    } catch (err) { next(err); }
  },

  async createFeedPost(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await socialService.createFeedPost(req.user!.uid, req.body);
      res.status(201).json({ data: post });
    } catch (err) { next(err); }
  },

  async getDiscoverFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const posts = await socialService.getDiscoverFeed(req.user!.uid, page, limit);
      res.json({ data: posts });
    } catch (err) { next(err); }
  },
};
