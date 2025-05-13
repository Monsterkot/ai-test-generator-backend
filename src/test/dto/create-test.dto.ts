export class CreateTestDto {
    title: string;
    questions: {
      question: string;
      options: string[];
      correctAnswer: string;
    }[];
  }
  