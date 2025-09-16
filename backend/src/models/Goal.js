const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Goal must belong to a user']
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [200, 'Goal title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Goal description is required'],
    trim: true,
    maxlength: [1000, 'Goal description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Goal category is required'],
    enum: [
      'learning',
      'career',
      'health',
      'fitness',
      'personal',
      'financial',
      'creative',
      'technical',
      'other'
    ],
    default: 'learning'
  },
  complexity: {
    type: String,
    required: [true, 'Goal complexity is required'],
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  targetDate: {
    type: Date,
    required: [true, 'Target completion date is required']
  },
  estimatedDuration: {
    weeks: {
      type: Number,
      min: [0, 'Duration cannot be negative'],
      max: [52, 'Duration cannot exceed 52 weeks']
    },
    months: {
      type: Number,
      min: [0, 'Duration cannot be negative'],
      max: [12, 'Duration cannot exceed 12 months']
    }
  },
  suggestedTimeline: {
    type: String,
    enum: ['6weeks', '3months', '6months', 'custom'],
    default: '6weeks'
  },
  customTimeline: {
    weeks: Number,
    months: Number
  },
  milestones: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Milestone title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Milestone description cannot exceed 500 characters']
    },
    targetDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue'],
      default: 'pending'
    },
    order: {
      type: Number,
      required: true
    },
    dependencies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone'
    }]
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  resources: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    url: String,
    type: {
      type: String,
      enum: ['article', 'video', 'course', 'book', 'tool', 'other'],
      default: 'other'
    },
    description: String
  }],
  progress: {
    overall: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    milestonesCompleted: {
      type: Number,
      default: 0
    },
    totalMilestones: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  completedAt: Date,
  notes: [{
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isImportant: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const target = new Date(this.targetDate);
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for is overdue
goalSchema.virtual('isOverdue').get(function() {
  return this.status === 'active' && new Date() > new Date(this.targetDate);
});

// Virtual for completion percentage
goalSchema.virtual('completionPercentage').get(function() {
  if (!this.milestones || this.milestones.length === 0) return 0;
  const completed = this.milestones.filter(m => m.status === 'completed').length;
  return Math.round((completed / this.milestones.length) * 100);
});

// Indexes for better query performance
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, category: 1 });
goalSchema.index({ user: 1, targetDate: 1 });
goalSchema.index({ status: 1, targetDate: 1 });
goalSchema.index({ tags: 1 });

// Pre-save middleware to validate estimatedDuration
goalSchema.pre('save', function(next) {
  if (this.estimatedDuration) {
    if (this.estimatedDuration.weeks === 0 && this.estimatedDuration.months === 0) {
      return next(new Error('At least one duration (weeks or months) must be greater than 0'));
    }
  }
  next();
});

// Pre-save middleware to update progress
goalSchema.pre('save', function(next) {
  if (this.milestones && this.milestones.length > 0) {
    this.progress.totalMilestones = this.milestones.length;
    this.progress.milestonesCompleted = this.milestones.filter(m => m.status === 'completed').length;
    this.progress.overall = this.completionPercentage;
    this.progress.lastUpdated = new Date();
  }
  next();
});

// Pre-save middleware to set completed date
goalSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Instance method to add milestone
goalSchema.methods.addMilestone = function(milestoneData) {
  const order = this.milestones ? this.milestones.length : 0;
  if (!this.milestones) {
    this.milestones = [];
  }
  this.milestones.push({
    ...milestoneData,
    order
  });
  return this.save();
};

// Instance method to update milestone
goalSchema.methods.updateMilestone = function(milestoneId, updateData) {
  if (!this.milestones) {
    throw new Error('No milestones found');
  }
  const milestone = this.milestones.id(milestoneId);
  if (milestone) {
    Object.assign(milestone, updateData);
    
    // Update progress when milestone status changes
    this.updateProgress();
    
    return this.save();
  }
  throw new Error('Milestone not found');
};

// Instance method to calculate and update progress
goalSchema.methods.updateProgress = function() {
  const totalMilestones = this.milestones ? this.milestones.length : 0;
  const completedMilestones = this.milestones ? this.milestones.filter(m => m.status === 'completed').length : 0;
  
  this.progress.totalMilestones = totalMilestones;
  this.progress.milestonesCompleted = completedMilestones;
  this.progress.overall = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  this.progress.lastUpdated = new Date();
  
  // Update goal status based on progress
  if (this.progress.overall === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (this.progress.overall > 0 && this.status === 'draft') {
    this.status = 'active';
  }
};

// Instance method to delete milestone
goalSchema.methods.deleteMilestone = function(milestoneId) {
  if (!this.milestones) {
    throw new Error('No milestones found');
  }
  this.milestones.pull(milestoneId);
  
  // Update progress after deleting milestone
  this.updateProgress();
  
  return this.save();
};

// Instance method to add note
goalSchema.methods.addNote = function(content, isImportant = false) {
  if (!this.notes) {
    this.notes = [];
  }
  this.notes.push({
    content,
    isImportant,
    createdAt: new Date()
  });
  return this.save();
};

// Static method to find goals by user
goalSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  if (options.status) query.status = options.status;
  if (options.category) query.category = options.category;
  if (options.isArchived !== undefined) query.isArchived = options.isArchived;
  
  return this.find(query)
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to find overdue goals
goalSchema.statics.findOverdue = function() {
  return this.find({
    status: 'active',
    targetDate: { $lt: new Date() }
  }).populate('user', 'firstName lastName email');
};

module.exports = mongoose.model('Goal', goalSchema);