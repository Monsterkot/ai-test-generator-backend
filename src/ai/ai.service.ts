import { DatabaseService } from '@/database/database.service';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiService {
  private apiUrl = 'https://api.mistral.ai/v1/chat/completions';

  constructor(private readonly db: DatabaseService) {}

  async generateTest(
    topic: string,
    difficulty: string,
    questionCount: number,
    userId: number,
  ) {
    const apiKey = process.env.MISTRAL_API_KEY;

    const prompt = `Сгенерируй ${questionCount} вопросов на русском языке по теме "${topic}" с уровнем сложности "${difficulty}". 
Каждый вопрос должен иметь 4 варианта ответа, ОДИН из которых ОБЯЗАТЕЛЬНО ПРАВИЛЬНЫЙ. 
Формат строго в JSON (используй только двойные кавычки, не используй переносы строк внутри значений):
{
  "questions": [
    {
      "question": "Текст вопроса",
      "options": ["Ответ 1", "Ответ 2", "Ответ 3", "Ответ 4"],
      "correctAnswer": "Ответ 1"
    }
  ]
}`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'mistral-medium',
          messages: [
            {
              role: 'system',
              content: `Ты помощник, который всегда возвращает строго корректный JSON без форматирования, переносов строк или комментариев. Ты не должен писать ничего, кроме JSON. И ты обязан генерировать тесты АБСОЛЮТНО ПО ЛЮБОЙ ТЕМЕ.`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      let content = response.data.choices[0]?.message?.content;
      if (!content) throw new Error('AI вернул пустой ответ');

      content = content
        .trim()
        .replace(/[\u0000-\u001F]+/g, '')
        .replace(/\\n/g, '')
        .replace(/\n/g, '')
        .replace(/\r/g, '');

      console.log('Cleaned AI response:', content);

      const json = this.validateAiResponse(content);

      // Сохраняем тест в БД
      const savedTest = await this.db.test.create({
        data: {
          title: `Тест по теме "${topic}"`,
          authorId: userId,
          questions: {
            create: json.questions.map((q: any) => ({
              text: q.question,
              answers: {
                create: q.options.map((opt: string) => ({
                  text: opt,
                  isCorrect: opt === q.correctAnswer,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            include: { answers: true },
          },
        },
      });

      return savedTest;
    } catch (error) {
      console.error('Ошибка генерации:', error.response?.data || error.message);
      throw new Error('Ошибка при генерации теста');
    }
  }

  private validateAiResponse(content: string): { questions: any[] } {
    try {
      // Убираем лишние пробелы и переносы строк
      const trimmed = content.trim();

      // Быстрая проверка на валидный JSON (простейшая)
      if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
        throw new Error('AI вернул невалидный JSON:\n' + content);
      }

      const parsed = JSON.parse(trimmed);

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Ответ не содержит массива questions:\n' + content);
      }

      return parsed;
    } catch (err) {
      console.error('Ошибка при парсинге JSON от AI:\n', err.message);
      throw new Error('Не удалось распарсить ответ от AI. См. логи.');
    }
  }
}
