// server/src/services/push.service.ts
// Envia push notifications via FCM HTTP v1 usando google-auth-library.
// Não depende do firebase-admin — apenas de uma Service Account JSON.
//
// Setup necessário:
//   1. Criar projeto no Firebase Console (só para FCM — sem Auth/Firestore)
//   2. Gerar Service Account: Project Settings → Service Accounts → Generate new private key
//   3. Salvar o JSON em server/config/fcm-service-account.json (ou outro caminho)
//   4. Adicionar ao server/.env:
//        FCM_SERVICE_ACCOUNT_PATH=./config/fcm-service-account.json
//        FCM_PROJECT_ID=seu-project-id

import fs from 'fs';
import path from 'path';
import https from 'https';
import { GoogleAuth } from 'google-auth-library';
import { env } from '../config/env';
import prisma from '../config/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// ─── Auth client (lazy — inicializa só quando FCM_SERVICE_ACCOUNT_PATH existe) ─

let _auth: GoogleAuth | null = null;

function getAuth(): GoogleAuth | null {
  if (_auth) return _auth;
  if (!env.FCM_SERVICE_ACCOUNT_PATH) return null;

  const accountPath = path.resolve(__dirname, '../../', env.FCM_SERVICE_ACCOUNT_PATH);
  if (!fs.existsSync(accountPath)) {
    console.warn(`[push] Service account não encontrado: ${accountPath}`);
    return null;
  }

  _auth = new GoogleAuth({
    keyFile: accountPath,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  return _auth;
}

// ─── Envio de mensagem FCM HTTP v1 ────────────────────────────────────────────

async function sendToToken(fcmToken: string, payload: PushPayload): Promise<void> {
  const auth = getAuth();
  if (!auth || !env.FCM_PROJECT_ID) return; // FCM não configurado — silencioso

  const accessToken = await auth.getAccessToken();
  if (!accessToken) return;

  const message = {
    message: {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data ?? {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channel_id: 'kinify_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    },
  };

  await new Promise<void>((resolve, reject) => {
    const body = JSON.stringify(message);
    const options: https.RequestOptions = {
      hostname: 'fcm.googleapis.com',
      path: `/v1/projects/${env.FCM_PROJECT_ID}/messages:send`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          // Token inválido (404) ou não registrado (410) — limpa do banco
          if (res.statusCode === 404 || res.statusCode === 410) {
            clearTokenByValue(fcmToken).catch(() => {});
          }
          resolve(); // não propaga erro — push é best-effort
        }
      });
    });

    req.on('error', () => resolve()); // best-effort
    req.write(body);
    req.end();
  });
}

async function clearTokenByValue(token: string): Promise<void> {
  await prisma.user.updateMany({
    where: { fcmToken: token },
    data: { fcmToken: null },
  });
}

// ─── Interface pública ────────────────────────────────────────────────────────

export const pushService = {
  /**
   * Envia push para um usuário pelo userId.
   * Silencioso se FCM não estiver configurado ou usuário não tiver token.
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });
    if (!user?.fcmToken) return;
    await sendToToken(user.fcmToken, payload);
  },

  /**
   * Envia push para múltiplos usuários de uma vez.
   */
  async sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, fcmToken: { not: null } },
      select: { fcmToken: true },
    });
    await Promise.allSettled(
      users
        .filter((u) => u.fcmToken)
        .map((u) => sendToToken(u.fcmToken!, payload)),
    );
  },

  /** Retorna true se FCM está configurado e pronto para uso. */
  isEnabled(): boolean {
    return !!(env.FCM_SERVICE_ACCOUNT_PATH && env.FCM_PROJECT_ID && getAuth());
  },
};
