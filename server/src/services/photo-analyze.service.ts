import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

export type PhotoFoodItem = {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type PhotoAnalyzeResult = {
  meal: string; // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  items: PhotoFoodItem[];
  notes?: string;
};

const SYSTEM_PROMPT = `Você é um nutricionista especializado em análise de refeições por imagem.
Analise a foto do prato fornecida e identifique CADA alimento visível separadamente.
Para cada alimento, estime a quantidade em gramas (ou ml para líquidos) e calcule os valores nutricionais.
Use a tabela TACO (Tabela Brasileira de Composição de Alimentos) como referência quando possível.

Responda APENAS com um JSON válido no seguinte formato (sem markdown, sem texto adicional):
{
  "meal": "lunch",
  "items": [
    {
      "name": "Arroz branco cozido",
      "quantity": 150,
      "unit": "g",
      "calories": 207,
      "protein": 3.8,
      "carbs": 45.1,
      "fat": 0.3
    }
  ],
  "notes": "Estimativa baseada em porção visual padrão"
}

Regras:
- "meal": inferir pelo tipo de prato ("breakfast", "lunch", "dinner" ou "snack")
- "quantity": sempre em número (gramas para sólidos, ml para líquidos)
- "unit": sempre "g" ou "ml"
- Valores nutricionais referentes à quantidade estimada do alimento no prato (não por 100g)
- Se não conseguir identificar um alimento com certeza, inclua com estimativa conservadora
- Máximo 12 itens
- Responda apenas o JSON, sem texto antes ou depois`;

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const photoAnalyzeService = {
  async analyzePhoto(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<PhotoAnalyzeResult> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let result;
    try {
      result = await model.generateContent([
        SYSTEM_PROMPT,
        { inlineData: { mimeType, data: imageBase64 } },
      ]);
    } catch (err: any) {
      if (err?.status === 429) {
        const retryMatch = String(err?.message ?? '').match(/Please retry in ([\d.]+)s/i);
        const seconds = retryMatch ? Math.round(parseFloat(retryMatch[1])) : null;
        const msg = seconds && seconds < 3600
          ? `Limite de requisições do Gemini atingido. Tente novamente em ${seconds} segundos.`
          : 'Quota diária do Gemini atingida. Tente novamente amanhã ou ative o faturamento em aistudio.google.com.';
        const e = new Error(msg);
        (e as any).statusCode = 429;
        throw e;
      }
      throw err;
    }

    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const jsonText = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed: PhotoAnalyzeResult;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error('Gemini retornou resposta inválida');
    }

    // Sanitize
    const validMeals = ['breakfast', 'lunch', 'dinner', 'snack'];
    return {
      meal: validMeals.includes(parsed.meal) ? parsed.meal : 'snack',
      items: (parsed.items ?? []).slice(0, 12).map((item) => ({
        name: String(item.name ?? ''),
        quantity: Number(item.quantity) || 100,
        unit: item.unit === 'ml' ? 'ml' : 'g',
        calories: Math.max(0, Number(item.calories) || 0),
        protein: Math.max(0, Number(item.protein) || 0),
        carbs: Math.max(0, Number(item.carbs) || 0),
        fat: Math.max(0, Number(item.fat) || 0),
      })),
      notes: parsed.notes,
    };
  },
};
