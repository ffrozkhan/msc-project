import Joi from 'joi';

// Generic validator factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const messages = error.details.map(d => d.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    req[property] = value;
    next();
  };
};

// ── Auth schemas ───────────────────────────────────────────────
export const validateRegister = validate(Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
}));

export const validateLogin = validate(Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
}));

export const validateChangePassword = validate(Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     Joi.string().min(6).max(100).required(),
}));

// ── Flashcard schemas ──────────────────────────────────────────
export const validateReview = validate(Joi.object({
  quality: Joi.number().integer().min(0).max(5).required(),
}));

// ── Quiz schemas ───────────────────────────────────────────────
export const validateQuizSubmit = validate(Joi.object({
  answers: Joi.array().items(Joi.string().allow('')).required(),
}));

// ── Conversation schemas ───────────────────────────────────────
export const validateMessage = validate(Joi.object({
  message: Joi.string().min(1).max(5000).required(),
}));

export const validateTitle = validate(Joi.object({
  title: Joi.string().min(1).max(200).required(),
}));

// ── Video answer schemas ───────────────────────────────────────
export const validateVideoSubmit = validate(Joi.object({
  question:   Joi.string().min(1).max(1000).required(),
  transcript: Joi.string().min(1).max(10000).required(),
  duration:   Joi.number().min(0).optional(),
}));

// ── AI schemas ─────────────────────────────────────────────────
export const validateChat = validate(Joi.object({
  message:    Joi.string().min(1).max(5000).required(),
  documentId: Joi.string().required(),
  history:    Joi.array().optional(),
}));

export const validateGenerateFlashcards = validate(Joi.object({
  documentId: Joi.string().required(),
  count:      Joi.number().integer().min(1).max(50).optional(),
}));

export const validateGenerateQuiz = validate(Joi.object({
  documentId:      Joi.string().required(),
  numberOfQuestions: Joi.number().integer().min(1).max(30).optional(),
}));

export default validate;