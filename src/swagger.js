import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Khatwaat AI API',
      version: '1.0.0',
      description: 'API Documentation for the Adaptive Exam System',
    },
    servers: [
      {
        url: 'http://13.60.170.190:3000',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ExamStartRequest: {
          type: 'object',
          required: ['subjects'],
          properties: {
            subjects: { type: 'array', items: { type: 'string' }, example: ['MATH', 'ARABIC', 'IQ', 'ENGLISH', 'SCIENCE'] },
            userId: { type: 'string', example: '60d0fe4f5311236168a109ca', description: 'Optional if using Bearer token later' },
            max_questions_per_subject: { type: 'integer', example: 20 },
            target_se: { type: 'number', example: 0.3 }
          }
        },
        SubmitAnswerRequest: {
          type: 'object',
          required: ['exam_session_id', 'python_session_id', 'question_id', 'user_answer'],
          properties: {
            exam_session_id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
            python_session_id: { type: 'string', example: 'SESSION_60d0fe4f_1620000000' },
            question_id: { type: 'string', example: 'AR001' },
            user_answer: { type: 'string', example: 'B' },
            time_taken_seconds: { type: 'integer', example: 45 }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'student@example.com' },
            password: { type: 'string', example: 'password123' }
          }
        },
        SignupRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'phone'],
          properties: {
            name: { type: 'string', example: 'Ahmed Ali' },
            email: { type: 'string', example: 'ahmed@example.com' },
            password: { type: 'string', example: 'securepassword123' },
            phone: { type: 'string', example: '01012345678' },
            age: { type: 'integer', example: 20 }
          }
        },
        CreatePostRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', example: 'Hello Community! What is the best way to study Math?' },
            tags: { type: 'array', items: { type: 'string' }, example: ['math', 'study'] }
          }
        },
        CreateCommentRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', example: 'I found solving past papers very helpful.' }
          }
        },
        AddQuestionRequest: {
          type: 'object',
          required: ['question_id', 'subject', 'text', 'options', 'correct_answer', 'irt_parameters'],
          properties: {
            question_id: { type: 'string', example: 'Q123' },
            subject: { type: 'string', example: 'MATH' },
            text: { type: 'string', example: 'What is 2+2?' },
            options: { type: 'object', example: { A: '3', B: '4', C: '5', D: '6' } },
            correct_answer: { type: 'string', example: 'B' },
            irt_parameters: {
              type: 'object',
              properties: {
                difficulty_b: { type: 'number', example: 0.5 },
                discrimination_a: { type: 'number', example: 1.2 }
              }
            }
          }
        }
      }
    },
    paths: {
      '/auth/signup': {
        post: {
          summary: 'Register a new user',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SignupRequest' } } }
          },
          responses: {
            201: { description: 'User created successfully' },
            409: { description: 'Email already exists' }
          }
        }
      },
      '/auth/login': {
        post: {
          summary: 'Login a user',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
          },
          responses: {
            200: { description: 'Login successful' },
            400: { description: 'Invalid email or password' }
          }
        }
      },
      '/auth/profile': {
        get: {
          summary: 'Get current user profile',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Returns user profile data' },
            401: { description: 'Unauthorized' },
            404: { description: 'User not found' }
          }
        }
      },
      '/exam/start': {
        post: {
          summary: 'Start a new adaptive exam',
          tags: ['Exam'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ExamStartRequest' } } }
          },
          responses: {
            200: { 
              description: 'Exam started, returns the first question and session IDs',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      exam_session_id: { type: 'string' },
                      python_session_id: { type: 'string' },
                      first_question: {
                        type: 'object',
                        properties: {
                          question_id: { type: 'string' },
                          text: { type: 'string', description: 'The question text to display' },
                          options: { 
                            type: 'object', 
                            additionalProperties: { type: 'string' },
                            description: 'Key-value pairs of options, e.g., {"A": "Option 1", "B": "Option 2"}'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            404: { description: 'No questions found for the subject' },
            500: { description: 'Server Error' }
          }
        }
      },
      '/exam/submit-answer': {
        post: {
          summary: 'Submit an answer to the current question',
          tags: ['Exam'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitAnswerRequest' } } }
          },
          responses: {
            200: { 
              description: 'Answer processed. Returns next question OR final result if finished',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      is_finished: { type: 'boolean', description: 'If true, the exam is over and result is provided.' },
                      next_question: {
                        type: 'object',
                        description: 'Provided if is_finished is false',
                        properties: {
                          question_id: { type: 'string' },
                          text: { type: 'string' },
                          options: { type: 'object', additionalProperties: { type: 'string' } }
                        }
                      },
                      result: {
                        type: 'object',
                        description: 'Provided if is_finished is true',
                        properties: {
                          estimated_theta: { type: 'number', description: 'Final calculated student ability score' },
                          standard_error: { type: 'number' },
                          total_questions: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            },
            404: { description: 'Exam session not found' },
            500: { description: 'Server Error' }
          }
        }
      },
      '/anti-cheat/event': {
        post: {
          summary: 'Log an anti-cheat event',
          tags: ['Anti-Cheat'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    session_id: { type: 'string' },
                    event_type: { type: 'string', enum: ['tab_switch', 'copy_paste', 'fullscreen_exit', 'devtools_open', 'webcam_face_missing'] },
                    event_data: { type: 'object' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Event logged successfully' } }
        }
      },
      '/anti-cheat/session/{session_id}': {
        get: {
          summary: 'Get session risk summary',
          tags: ['Anti-Cheat'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'session_id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'Returns risk profile for the session' } }
        }
      },
      '/analytics/student': {
        get: {
          summary: 'Get analytics for the current student',
          tags: ['Analytics'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Returns student analytics dashboard data' } }
        }
      },
      '/analytics/admin': {
        get: {
          summary: 'Get system-wide analytics for admin',
          tags: ['Analytics'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Returns system-wide stats and alerts' } }
        }
      },
      '/recommendations': {
        get: {
          summary: 'Get personalized study recommendations based on performance',
          tags: ['Recommendations'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Returns short-term and long-term recommendations' } }
        }
      },
      '/recommendations/track': {
        get: {
          summary: 'Get AI track classification prediction',
          tags: ['Recommendations'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Returns predicted academic track' } }
        }
      },
      '/community/posts': {
        get: {
          summary: 'Get all posts paginated',
          tags: ['Community'],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: { 200: { description: 'Returns a list of posts' } }
        },
        post: {
          summary: 'Create a new post',
          tags: ['Community'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePostRequest' } } }
          },
          responses: { 201: { description: 'Post created successfully' } }
        }
      },
      '/community/posts/{id}': {
        get: {
          summary: 'Get a post by ID',
          tags: ['Community'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Returns the post' }, 404: { description: 'Post not found' } }
        },
        delete: {
          summary: 'Delete a post',
          tags: ['Community'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Post deleted successfully' }, 404: { description: 'Post not found' } }
        }
      },
      '/community/posts/{id}/like': {
        put: {
          summary: 'Toggle like on a post',
          tags: ['Community'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Returns like status' }, 404: { description: 'Post not found' } }
        }
      },
      '/community/posts/{id}/comments': {
        get: {
          summary: 'Get comments for a post',
          tags: ['Community'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: { 200: { description: 'Returns comments' } }
        },
        post: {
          summary: 'Add a comment to a post',
          tags: ['Community'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCommentRequest' } } }
          },
          responses: { 201: { description: 'Comment added successfully' } }
        }
      },
      '/admin/stats/general': {
        get: {
          summary: 'Get general statistics for dashboard',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Returns general system stats' } }
        }
      },
      '/admin/stats/questions': {
        get: {
          summary: 'Get statistics on hardest questions',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Returns question stats' } }
        }
      },
      '/admin/users': {
        get: {
          summary: 'Get all users paginated',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
          ],
          responses: { 200: { description: 'Returns users' } }
        }
      },
      '/admin/questions': {
        get: {
          summary: 'Get all questions paginated',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
          ],
          responses: { 200: { description: 'Returns questions' } }
        },
        post: {
          summary: 'Add a new question',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AddQuestionRequest' } } }
          },
          responses: { 201: { description: 'Question created successfully' } }
        }
      },
      '/admin/questions/{id}': {
        put: {
          summary: 'Update a question',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AddQuestionRequest' } } }
          },
          responses: { 200: { description: 'Question updated successfully' } }
        },
        delete: {
          summary: 'Delete a question',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Question deleted successfully' } }
        }
      }
    }
  },
  apis: [], // We are defining the paths above directly instead of parsing files for simplicity
};

export const specs = swaggerJsdoc(options);
