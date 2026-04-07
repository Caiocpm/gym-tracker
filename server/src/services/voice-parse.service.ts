import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

export type VoiceFoodItem = {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type VoiceParseResult = {
  meal: string;
  items: VoiceFoodItem[];
  notes?: string;
};

const PROMPT = `Você é um nutricionista especializado em análise de refeições.
O usuário descreveu oralmente o que comeu. Identifique cada alimento mencionado, estime a quantidade e calcule os valores nutricionais.
Use a tabela TACO (Tabela Brasileira de Composição de Alimentos) como referência.

Texto do usuário: "{TEXT}"

Responda APENAS com um JSON válido (sem markdown, sem texto adicional):
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
  "notes": "Estimativa baseada na descrição"
}

Regras:
- "meal": inferir pelo contexto ("breakfast", "lunch", "dinner" ou "snack")
- "quantity": número correspondente à quantidade mencionada ou estimada
- "unit": "g" para sólidos, "ml" para líquidos
- Valores nutricionais para a quantidade informada (não por 100g)
- Se o usuário não mencionar quantidade, use uma porção padrão típica
- Máximo 12 itens
- Responda apenas o JSON`;

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const voiceParseService = {
  async parseVoiceCommand(text: string): Promise<VoiceParseResult> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = PROMPT.replace('{TEXT}', text.trim());

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (err: any) {
      if (err?.status === 429) {
        const retryMatch = String(err?.message ?? '').match(/Please retry in ([\d.]+)s/i);
        const seconds = retryMatch ? Math.round(parseFloat(retryMatch[1])) : null;
        const msg = seconds && seconds < 3600
          ? `Limite do Gemini atingido. Tente em ${seconds}s.`
          : 'Quota diária do Gemini atingida. Tente amanhã.';
        const e = new Error(msg);
        (e as any).statusCode = 429;
        throw e;
      }
      throw err;
    }

    const text2 = result.response.text().trim();
    const jsonText = text2.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed: VoiceParseResult;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error('Gemini retornou resposta inválida');
    }

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
