const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Check-in must belong to a user']
  },
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: [true, 'Check-in must be associated with a goal']
  },
  journey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journey',
    required: false // Optional, for journey-specific check-ins
  },
  title: {
    type: String,
    required: [true, 'Check-in title is required'],
    trim: true,
    maxlength: [200, 'Check-in title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Check-in description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['goal', 'journey', 'milestone', 'general'],
    default: 'goal'
  },
  status: {
    type: String,
    enum: ['scheduled', 'pending', 'completed', 'missed', 'cancelled'],
    default: 'scheduled'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'custom'],
    required: [true, 'Check-in frequency is required'],
    default: 'weekly'
  },
  customFrequency: {
    days: {
      type: Number,
      min: [1, 'Custom frequency must be at least 1 day'],
      max: [365, 'Custom frequency cannot exceed 365 days']
    },
    hours: {
      type: Number,
      min: [0, 'Hours cannot be negative'],
      max: [23, 'Hours cannot exceed 23']
    }
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  completedDate: {
    type: Date
  },
  nextScheduledDate: {
    type: Date
  },
  reminderSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    advanceTime: {
      type: Number, // minutes before scheduled time
      default: 60
    },
    methods: [{
      type: String,
      enum: ['email', 'push', 'in-app'],
      default: 'email'
    }]
  },
  progressAssessment: {
    overallProgress: {
      type: Number,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100%']
    },
    mood: {
      type: String,
      enum: ['excellent', 'good', 'neutral', 'poor', 'terrible']
    },
    energy: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    motivation: {
      type: String,
      enum: ['very_high', 'high', 'medium', 'low', 'very_low']
    },
    challenges: [{
      type: String,
      trim: true,
      maxlength: [200, 'Challenge description cannot exceed 200 characters']
    }],
    achievements: [{
      type: String,
      trim: true,
      maxlength: [200, 'Achievement description cannot exceed 200 characters']
    }],
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [10, 'Rating cannot exceed 10']
    }
  },
  responses: [{
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'rating', 'multiple_choice', 'boolean'],
      default: 'text'
    },
    options: [String] // For multiple choice questions
  }],
  isRecurring: {
    type: Boolean,
    default: true
  },
  recurrenceEndDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    timeSpent: {
      type: Number, // in minutes
      default: 0
    },
    location: {
      type: String,
      trim: true
    },
    device: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days until next check-in
checkInSchema.virtual('daysUntilNext').get(function() {
  if (!this.nextScheduledDate) return null;
  const now = new Date();
  const diffTime = this.nextScheduledDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
checkInSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed') return false;
  return new Date() > this.scheduledDate;
});

// Virtual for completion percentage
checkInSchema.virtual('completionPercentage').get(function() {
  if (this.status === 'completed') return 100;
  if (this.status === 'missed') return 0;
  if (this.progressAssessment?.overallProgress !== undefined) {
    return this.progressAssessment.overallProgress;
  }
  return 0;
});

// Indexes for better query performance
checkInSchema.index({ user: 1, scheduledDate: 1 });
checkInSchema.index({ user: 1, status: 1 });
checkInSchema.index({ goal: 1, scheduledDate: 1 });
checkInSchema.index({ scheduledDate: 1, status: 1 });
checkInSchema.index({ nextScheduledDate: 1, status: 1 });

// Pre-save middleware to calculate next scheduled date
checkInSchema.pre('save', function(next) {
  if (this.isNew && this.isRecurring && !this.nextScheduledDate) {
    this.nextScheduledDate = this.calculateNextScheduledDate();
  }
  next();
});

// Instance method to calculate next scheduled date
checkInSchema.methods.calculateNextScheduledDate = function() {
  const currentDate = this.scheduledDate || new Date();
  let nextDate = new Date(currentDate);

  switch (this.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'bi-weekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'custom':
      if (this.customFrequency) {
        nextDate.setDate(nextDate.getDate() + (this.customFrequency.days || 0));
        nextDate.setHours(nextDate.getHours() + (this.customFrequency.hours || 0));
      }
      break;
    default:
      nextDate.setDate(nextDate.getDate() + 7); // Default to weekly
  }

  return nextDate;
};

// Instance method to mark as completed
checkInSchema.methods.markCompleted = function(assessmentData = {}) {
  this.status = 'completed';
  this.completedDate = new Date();
  
  if (assessmentData) {
    this.progressAssessment = { ...this.progressAssessment, ...assessmentData };
  }

  // Schedule next check-in if recurring
  if (this.isRecurring) {
    this.nextScheduledDate = this.calculateNextScheduledDate();
  }

  return this.save();
};

// Instance method to mark as missed
checkInSchema.methods.markMissed = function() {
  this.status = 'missed';
  
  // Schedule next check-in if recurring
  if (this.isRecurring) {
    this.nextScheduledDate = this.calculateNextScheduledDate();
  }

  return this.save();
};

// Instance method to reschedule
checkInSchema.methods.reschedule = function(newDate) {
  this.scheduledDate = newDate;
  this.status = 'scheduled';
  this.nextScheduledDate = this.calculateNextScheduledDate();
  return this.save();
};

// Static method to find upcoming check-ins
checkInSchema.statics.findUpcoming = function(userId, limit = 10) {
  return this.find({
    user: userId,
    status: { $in: ['scheduled', 'pending'] },
    scheduledDate: { $gte: new Date() }
  })
  .populate('goal', 'title category')
  .populate('journey', 'title')
  .sort({ scheduledDate: 1 })
  .limit(limit);
};

// Static method to find overdue check-ins
checkInSchema.statics.findOverdue = function(userId) {
  return this.find({
    user: userId,
    status: { $in: ['scheduled', 'pending'] },
    scheduledDate: { $lt: new Date() }
  })
  .populate('goal', 'title category')
  .populate('journey', 'title');
};

// Static method to find check-ins by date range
checkInSchema.statics.findByDateRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    scheduledDate: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .populate('goal', 'title category')
  .populate('journey', 'title')
  .sort({ scheduledDate: 1 });
};


module.exports = mongoose.model('CheckIn', checkInSchema);