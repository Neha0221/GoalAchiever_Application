const Goal = require('../models/Goal');
const Journey = require('../models/Journey');
const CheckIn = require('../models/CheckIn');

class AssessmentService {
  // Generate dynamic assessment questions based on goal type and context
  static generateAssessmentQuestions(goal, journey = null, checkInType = 'goal') {
    try {
      const baseQuestions = this.getBaseQuestions();
      const categoryQuestions = this.getCategoryQuestions(goal.category);
      const complexityQuestions = this.getComplexityQuestions(goal.complexity);
      const journeyQuestions = journey ? this.getJourneyQuestions(journey) : [];
      const typeQuestions = this.getTypeQuestions(checkInType);

      // Combine all questions
      const allQuestions = [
        ...baseQuestions,
        ...categoryQuestions,
        ...complexityQuestions,
        ...journeyQuestions,
        ...typeQuestions
      ];

      // Remove duplicates and return
      return this.removeDuplicateQuestions(allQuestions);
    } catch (error) {
      throw new Error(`Failed to generate assessment questions: ${error.message}`);
    }
  }

  // Get base questions for all check-ins
  static getBaseQuestions() {
    return [
      {
        id: 'overall_progress',
        question: "How would you rate your overall progress on this goal?",
        type: "rating",
        required: true,
        options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        description: "Rate your progress from 1 (no progress) to 10 (goal completed)"
      },
      {
        id: 'mood',
        question: "How are you feeling about your progress?",
        type: "multiple_choice",
        required: true,
        options: ["Excellent", "Good", "Neutral", "Poor", "Terrible"],
        description: "Your emotional state regarding this goal"
      },
      {
        id: 'energy_level',
        question: "What's your energy level for working on this goal?",
        type: "multiple_choice",
        required: true,
        options: ["High", "Medium", "Low"],
        description: "Your current energy and motivation level"
      },
      {
        id: 'challenges',
        question: "What challenges did you face this period?",
        type: "text",
        required: false,
        description: "Describe any obstacles or difficulties you encountered"
      },
      {
        id: 'achievements',
        question: "What achievements are you proud of?",
        type: "text",
        required: false,
        description: "Share your wins and accomplishments"
      },
      {
        id: 'next_steps',
        question: "What are your next steps?",
        type: "text",
        required: false,
        description: "What do you plan to do next to move forward?"
      }
    ];
  }

  // Get category-specific questions
  static getCategoryQuestions(category) {
    const categoryQuestions = {
      learning: [
        {
          id: 'knowledge_gained',
          question: "What new knowledge or skills did you acquire?",
          type: "text",
          required: false,
          description: "Describe what you learned during this period"
        },
        {
          id: 'confidence_level',
          question: "How confident do you feel with the material?",
          type: "multiple_choice",
          required: true,
          options: ["Very Confident", "Confident", "Somewhat Confident", "Not Very Confident", "Not Confident"],
          description: "Your confidence level with the learning material"
        },
        {
          id: 'study_time',
          question: "How much time did you spend studying/practicing?",
          type: "number",
          required: false,
          description: "Hours spent on learning activities"
        }
      ],
      fitness: [
        {
          id: 'workout_frequency',
          question: "How many times did you exercise this period?",
          type: "number",
          required: true,
          description: "Number of workout sessions"
        },
        {
          id: 'physical_feeling',
          question: "How do you feel physically?",
          type: "multiple_choice",
          required: true,
          options: ["Excellent", "Good", "Fair", "Poor"],
          description: "Your current physical condition"
        },
        {
          id: 'fitness_improvements',
          question: "What fitness improvements did you notice?",
          type: "text",
          required: false,
          description: "Any physical improvements or changes you observed"
        }
      ],
      career: [
        {
          id: 'skill_development',
          question: "What professional skills did you develop?",
          type: "text",
          required: false,
          description: "New skills or abilities you gained"
        },
        {
          id: 'career_satisfaction',
          question: "How satisfied are you with your career progress?",
          type: "rating",
          required: true,
          options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          description: "Rate your satisfaction with career advancement"
        },
        {
          id: 'networking_activities',
          question: "What networking or professional activities did you engage in?",
          type: "text",
          required: false,
          description: "Professional connections or activities you participated in"
        }
      ],
      health: [
        {
          id: 'health_habits',
          question: "What healthy habits did you maintain or develop?",
          type: "text",
          required: false,
          description: "Positive health behaviors you practiced"
        },
        {
          id: 'health_concerns',
          question: "Any health concerns or issues to note?",
          type: "text",
          required: false,
          description: "Health-related observations or concerns"
        },
        {
          id: 'wellness_activities',
          question: "What wellness activities did you engage in?",
          type: "text",
          required: false,
          description: "Activities that contributed to your overall wellness"
        }
      ],
      financial: [
        {
          id: 'financial_progress',
          question: "What financial progress did you make?",
          type: "text",
          required: false,
          description: "Specific financial achievements or improvements"
        },
        {
          id: 'budget_adherence',
          question: "How well did you stick to your budget?",
          type: "multiple_choice",
          required: true,
          options: ["Excellent", "Good", "Fair", "Poor"],
          description: "Your adherence to financial planning"
        },
        {
          id: 'financial_learning',
          question: "What did you learn about personal finance?",
          type: "text",
          required: false,
          description: "New financial knowledge or insights gained"
        }
      ],
      creative: [
        {
          id: 'creative_output',
          question: "What creative work did you produce?",
          type: "text",
          required: false,
          description: "Creative projects or works you completed"
        },
        {
          id: 'inspiration_level',
          question: "How inspired do you feel creatively?",
          type: "rating",
          required: true,
          options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          description: "Your current level of creative inspiration"
        },
        {
          id: 'creative_challenges',
          question: "What creative challenges did you face?",
          type: "text",
          required: false,
          description: "Obstacles or difficulties in your creative process"
        }
      ]
    };

    return categoryQuestions[category] || [];
  }

  // Get complexity-specific questions
  static getComplexityQuestions(complexity) {
    const complexityQuestions = {
      beginner: [
        {
          id: 'learning_curve',
          question: "How steep is the learning curve for you?",
          type: "multiple_choice",
          required: false,
          options: ["Very Easy", "Easy", "Moderate", "Challenging", "Very Challenging"],
          description: "Your experience with the difficulty level"
        }
      ],
      intermediate: [
        {
          id: 'skill_application',
          question: "How well are you applying your existing skills?",
          type: "multiple_choice",
          required: false,
          options: ["Very Well", "Well", "Moderately", "Poorly", "Very Poorly"],
          description: "Your ability to apply previous knowledge"
        }
      ],
      advanced: [
        {
          id: 'expertise_development',
          question: "How is your expertise developing in this area?",
          type: "text",
          required: false,
          description: "Your progression toward expertise"
        }
      ],
      expert: [
        {
          id: 'mentoring_others',
          question: "Are you helping others with this goal?",
          type: "boolean",
          required: false,
          description: "Whether you're sharing your expertise with others"
        }
      ]
    };

    return complexityQuestions[complexity] || [];
  }

  // Get journey-specific questions
  static getJourneyQuestions(journey) {
    return [
      {
        id: 'journey_progress',
        question: "How is your learning journey progressing?",
        type: "text",
        required: false,
        description: "Your experience with the structured learning path"
      },
      {
        id: 'chunk_completion',
        question: "How many learning chunks have you completed?",
        type: "number",
        required: false,
        description: "Number of learning modules or chunks finished"
      },
      {
        id: 'journey_satisfaction',
        question: "How satisfied are you with the learning structure?",
        type: "rating",
        required: false,
        options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        description: "Your satisfaction with the journey organization"
      }
    ];
  }

  // Get type-specific questions
  static getTypeQuestions(type) {
    const typeQuestions = {
      goal: [
        {
          id: 'goal_clarity',
          question: "How clear is your goal to you?",
          type: "rating",
          required: false,
          options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          description: "Your clarity about what you want to achieve"
        }
      ],
      journey: [
        {
          id: 'journey_engagement',
          question: "How engaged are you with the learning journey?",
          type: "rating",
          required: false,
          options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          description: "Your level of engagement with the structured path"
        }
      ],
      milestone: [
        {
          id: 'milestone_achievement',
          question: "How significant was this milestone?",
          type: "multiple_choice",
          required: false,
          options: ["Very Significant", "Significant", "Moderately Significant", "Not Very Significant", "Not Significant"],
          description: "The importance of this milestone to your overall goal"
        }
      ],
      general: [
        {
          id: 'general_reflection',
          question: "What's your overall reflection on this period?",
          type: "text",
          required: false,
          description: "Your general thoughts and reflections"
        }
      ]
    };

    return typeQuestions[type] || [];
  }

  // Remove duplicate questions based on ID
  static removeDuplicateQuestions(questions) {
    const seen = new Set();
    return questions.filter(question => {
      if (seen.has(question.id)) {
        return false;
      }
      seen.add(question.id);
      return true;
    });
  }

  // Validate assessment responses
  static validateAssessmentResponses(questions, responses) {
    try {
      const errors = [];
      const validatedResponses = [];

      for (const question of questions) {
        const response = responses.find(r => r.questionId === question.id);
        
        // Check required questions
        if (question.required && (!response || !response.answer)) {
          errors.push({
            questionId: question.id,
            question: question.question,
            error: 'This question is required'
          });
          continue;
        }

        // Validate response format
        if (response && response.answer) {
          const validation = this.validateResponseFormat(question, response.answer);
          if (!validation.valid) {
            errors.push({
              questionId: question.id,
              question: question.question,
              error: validation.error
            });
            continue;
          }

          validatedResponses.push({
            questionId: question.id,
            question: question.question,
            answer: response.answer,
            type: question.type
          });
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        responses: validatedResponses
      };
    } catch (error) {
      throw new Error(`Failed to validate assessment responses: ${error.message}`);
    }
  }

  // Validate individual response format
  static validateResponseFormat(question, answer) {
    try {
      switch (question.type) {
        case 'rating':
          const rating = parseInt(answer);
          if (isNaN(rating) || rating < 1 || rating > 10) {
            return { valid: false, error: 'Rating must be a number between 1 and 10' };
          }
          break;

        case 'number':
          const number = parseFloat(answer);
          if (isNaN(number) || number < 0) {
            return { valid: false, error: 'Answer must be a positive number' };
          }
          break;

        case 'multiple_choice':
          if (!question.options.includes(answer)) {
            return { valid: false, error: 'Answer must be one of the provided options' };
          }
          break;

        case 'boolean':
          if (typeof answer !== 'boolean' && answer !== 'true' && answer !== 'false') {
            return { valid: false, error: 'Answer must be true or false' };
          }
          break;

        case 'text':
          if (typeof answer !== 'string' || answer.trim().length === 0) {
            return { valid: false, error: 'Answer must be non-empty text' };
          }
          break;

        default:
          return { valid: true };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid response format' };
    }
  }

  // Calculate assessment score
  static calculateAssessmentScore(responses) {
    try {
      let totalScore = 0;
      let maxScore = 0;
      let scoredQuestions = 0;

      for (const response of responses) {
        if (response.type === 'rating') {
          const score = parseInt(response.answer);
          if (!isNaN(score)) {
            totalScore += score;
            maxScore += 10;
            scoredQuestions++;
          }
        }
      }

      if (scoredQuestions === 0) {
        return { score: 0, percentage: 0, maxScore: 0 };
      }

      const percentage = Math.round((totalScore / maxScore) * 100);
      
      return {
        score: totalScore,
        maxScore,
        percentage,
        scoredQuestions
      };
    } catch (error) {
      throw new Error(`Failed to calculate assessment score: ${error.message}`);
    }
  }

  // Generate assessment insights
  static generateAssessmentInsights(responses, goal, previousAssessment = null) {
    try {
      const insights = [];

      // Find key responses
      const overallProgress = responses.find(r => r.questionId === 'overall_progress');
      const mood = responses.find(r => r.questionId === 'mood');
      const energy = responses.find(r => r.questionId === 'energy_level');
      const challenges = responses.find(r => r.questionId === 'challenges');
      const achievements = responses.find(r => r.questionId === 'achievements');

      // Progress insights
      if (overallProgress) {
        const progress = parseInt(overallProgress.answer);
        if (progress >= 8) {
          insights.push({
            type: 'positive',
            category: 'progress',
            message: 'Excellent progress! You\'re making great strides toward your goal.',
            priority: 'high'
          });
        } else if (progress >= 6) {
          insights.push({
            type: 'positive',
            category: 'progress',
            message: 'Good progress! Keep up the momentum.',
            priority: 'medium'
          });
        } else if (progress <= 3) {
          insights.push({
            type: 'concern',
            category: 'progress',
            message: 'Progress seems slow. Consider adjusting your approach or breaking down the goal into smaller steps.',
            priority: 'high'
          });
        }
      }

      // Mood insights
      if (mood) {
        if (mood.answer === 'Excellent' || mood.answer === 'Good') {
          insights.push({
            type: 'positive',
            category: 'mood',
            message: 'Great to see you\'re feeling positive about your progress!',
            priority: 'medium'
          });
        } else if (mood.answer === 'Poor' || mood.answer === 'Terrible') {
          insights.push({
            type: 'concern',
            category: 'mood',
            message: 'It seems you\'re feeling discouraged. Remember that setbacks are part of the journey.',
            priority: 'high'
          });
        }
      }

      // Energy insights
      if (energy) {
        if (energy.answer === 'Low') {
          insights.push({
            type: 'suggestion',
            category: 'energy',
            message: 'Low energy detected. Consider taking a break or adjusting your schedule.',
            priority: 'medium'
          });
        }
      }

      // Challenge insights
      if (challenges && challenges.answer && challenges.answer.trim().length > 0) {
        insights.push({
          type: 'support',
          category: 'challenges',
          message: 'You\'ve identified some challenges. Consider seeking help or adjusting your strategy.',
          priority: 'medium'
        });
      }

      // Achievement insights
      if (achievements && achievements.answer && achievements.answer.trim().length > 0) {
        insights.push({
          type: 'celebration',
          category: 'achievements',
          message: 'Congratulations on your achievements! Celebrating wins helps maintain motivation.',
          priority: 'medium'
        });
      }

      // Comparison with previous assessment
      if (previousAssessment) {
        const previousProgress = previousAssessment.responses?.find(r => r.questionId === 'overall_progress');
        if (overallProgress && previousProgress) {
          const currentProgress = parseInt(overallProgress.answer);
          const prevProgress = parseInt(previousProgress.answer);
          
          if (currentProgress > prevProgress) {
            insights.push({
              type: 'positive',
              category: 'trend',
              message: 'Your progress has improved since the last check-in!',
              priority: 'high'
            });
          } else if (currentProgress < prevProgress) {
            insights.push({
              type: 'concern',
              category: 'trend',
              message: 'Progress has slowed down. Consider what might be causing this.',
              priority: 'medium'
            });
          }
        }
      }

      return insights;
    } catch (error) {
      throw new Error(`Failed to generate assessment insights: ${error.message}`);
    }
  }

  // Get assessment template for a goal
  static async getAssessmentTemplate(goalId, journeyId = null, checkInType = 'goal') {
    try {
      const goal = await Goal.findById(goalId);
      if (!goal) {
        throw new Error('Goal not found');
      }

      let journey = null;
      if (journeyId) {
        journey = await Journey.findById(journeyId);
      }

      const questions = this.generateAssessmentQuestions(goal, journey, checkInType);
      
      return {
        goalId,
        journeyId,
        checkInType,
        questions,
        generatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get assessment template: ${error.message}`);
    }
  }
}

module.exports = AssessmentService;
