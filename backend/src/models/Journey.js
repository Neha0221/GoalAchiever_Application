const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema({
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: [true, 'Journey must belong to a goal']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Journey must belong to a user']
  },
  title: {
    type: String,
    required: [true, 'Journey title is required'],
    trim: true,
    maxlength: [200, 'Journey title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Journey description is required'],
    trim: true,
    maxlength: [1000, 'Journey description cannot exceed 1000 characters']
  },
  duration: {
    weeks: {
      type: Number,
      required: true,
      min: [0, 'Duration cannot be negative'],
      max: [52, 'Duration cannot exceed 52 weeks']
    },
    months: {
      type: Number,
      min: [0, 'Months cannot be negative'],
      max: [12, 'Duration cannot exceed 12 months']
    }
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'paused', 'completed', 'cancelled'],
    default: 'planned'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  chunks: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Chunk title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Chunk description cannot exceed 500 characters']
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    duration: {
      weeks: {
        type: Number,
        required: true,
        min: 1,
        max: 4
      }
    },
    learningObjectives: [{
      objective: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Objective cannot exceed 200 characters']
      },
      isCompleted: {
        type: Boolean,
        default: false
      },
      completedAt: Date
    }],
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
      ref: 'Chunk'
    }],
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    resources: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      url: String,
      type: {
        type: String,
        enum: ['article', 'video', 'course', 'book', 'tool', 'exercise', 'other'],
        default: 'other'
      },
      description: String,
      isCompleted: {
        type: Boolean,
        default: false
      }
    }],
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
  }],
  progress: {
    overall: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    chunksCompleted: {
      type: Number,
      default: 0
    },
    totalChunks: {
      type: Number,
      default: 0
    },
    objectivesCompleted: {
      type: Number,
      default: 0
    },
    totalObjectives: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  completedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days remaining
journeySchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for is overdue
journeySchema.virtual('isOverdue').get(function() {
  if (!this.status || !this.endDate) {
    return false;
  }
  return this.status === 'active' && new Date() > new Date(this.endDate);
});

// Virtual for current chunk
journeySchema.virtual('currentChunk').get(function() {
  if (!this.chunks || !Array.isArray(this.chunks)) {
    return null;
  }
  const now = new Date();
  return this.chunks.find(chunk => 
    chunk.startDate && chunk.endDate &&
    new Date(chunk.startDate) <= now && new Date(chunk.endDate) >= now
  );
});

// Virtual for next chunk
journeySchema.virtual('nextChunk').get(function() {
  if (!this.chunks || !Array.isArray(this.chunks)) {
    return null;
  }
  const now = new Date();
  return this.chunks.find(chunk => 
    chunk.startDate && new Date(chunk.startDate) > now
  );
});

// Indexes for better query performance
journeySchema.index({ user: 1, status: 1 });
journeySchema.index({ goal: 1, status: 1 });
journeySchema.index({ user: 1, startDate: 1 });
journeySchema.index({ status: 1, endDate: 1 });
journeySchema.index({ tags: 1 });

// Pre-save middleware to validate duration
journeySchema.pre('save', function(next) {
  if (this.duration) {
    if (this.duration.weeks === 0 && this.duration.months === 0) {
      return next(new Error('At least one duration (weeks or months) must be greater than 0'));
    }
  }
  next();
});

// Pre-save middleware to update progress
journeySchema.pre('save', function(next) {
  if (this.chunks && this.chunks.length > 0) {
    this.progress.totalChunks = this.chunks.length;
    this.progress.chunksCompleted = this.chunks.filter(c => c.status === 'completed').length;
    
    // Calculate objectives progress
    let totalObjectives = 0;
    let completedObjectives = 0;
    
    this.chunks.forEach(chunk => {
      if (chunk.learningObjectives) {
        totalObjectives += chunk.learningObjectives.length;
        completedObjectives += chunk.learningObjectives.filter(obj => obj.isCompleted).length;
      }
    });
    
    this.progress.totalObjectives = totalObjectives;
    this.progress.objectivesCompleted = completedObjectives;
    
    // Calculate overall progress
    const chunkProgress = this.progress.totalChunks > 0 
      ? (this.progress.chunksCompleted / this.progress.totalChunks) * 100 
      : 0;
    
    this.progress.overall = Math.round(chunkProgress);
    this.progress.lastUpdated = new Date();
  }
  next();
});

// Pre-save middleware to set completed date
journeySchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Instance method to add chunk
journeySchema.methods.addChunk = function(chunkData) {
  const order = this.chunks ? this.chunks.length : 0;
  if (!this.chunks) {
    this.chunks = [];
  }
  this.chunks.push({
    ...chunkData,
    order
  });
  return this.save();
};

// Instance method to update chunk
journeySchema.methods.updateChunk = function(chunkId, updateData) {
  if (!this.chunks) {
    throw new Error('No chunks found');
  }
  const chunk = this.chunks.id(chunkId);
  if (chunk) {
    Object.assign(chunk, updateData);
    return this.save();
  }
  throw new Error('Chunk not found');
};

// Instance method to delete chunk
journeySchema.methods.deleteChunk = function(chunkId) {
  if (!this.chunks) {
    throw new Error('No chunks found');
  }
  this.chunks.pull(chunkId);
  return this.save();
};

// Instance method to add objective to chunk
journeySchema.methods.addObjectiveToChunk = function(chunkId, objectiveData) {
  if (!this.chunks) {
    throw new Error('No chunks found');
  }
  const chunk = this.chunks.id(chunkId);
  if (chunk) {
    if (!chunk.learningObjectives) {
      chunk.learningObjectives = [];
    }
    chunk.learningObjectives.push(objectiveData);
    return this.save();
  }
  throw new Error('Chunk not found');
};

// Instance method to update objective
journeySchema.methods.updateObjective = function(chunkId, objectiveId, updateData) {
  if (!this.chunks) {
    throw new Error('No chunks found');
  }
  const chunk = this.chunks.id(chunkId);
  if (chunk) {
    if (!chunk.learningObjectives) {
      throw new Error('No learning objectives found in chunk');
    }
    const objective = chunk.learningObjectives.id(objectiveId);
    if (objective) {
      Object.assign(objective, updateData);
      if (updateData.isCompleted && !objective.completedAt) {
        objective.completedAt = new Date();
      }
      return this.save();
    }
    throw new Error('Objective not found');
  }
  throw new Error('Chunk not found');
};

// Instance method to add note to chunk
journeySchema.methods.addNoteToChunk = function(chunkId, content, isImportant = false) {
  if (!this.chunks) {
    throw new Error('No chunks found');
  }
  const chunk = this.chunks.id(chunkId);
  if (chunk) {
    if (!chunk.notes) {
      chunk.notes = [];
    }
    chunk.notes.push({
      content,
      isImportant,
      createdAt: new Date()
    });
    return this.save();
  }
  throw new Error('Chunk not found');
};

// Static method to find journeys by user
journeySchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  if (options.status) query.status = options.status;
  if (options.goal) query.goal = options.goal;
  if (options.isArchived !== undefined) query.isArchived = options.isArchived;
  
  return this.find(query)
    .populate('user', 'firstName lastName email')
    .populate('goal', 'title description')
    .sort({ startDate: 1 });
};

// Static method to find journeys by goal
journeySchema.statics.findByGoal = function(goalId) {
  return this.find({ goal: goalId })
    .populate('user', 'firstName lastName email')
    .populate('goal', 'title description')
    .sort({ startDate: 1 });
};

// Static method to find overdue journeys
journeySchema.statics.findOverdue = function() {
  return this.find({
    status: 'active',
    endDate: { $lt: new Date() }
  }).populate('user', 'firstName lastName email')
    .populate('goal', 'title description');
};

module.exports = mongoose.model('Journey', journeySchema);