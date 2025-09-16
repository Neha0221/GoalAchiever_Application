const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Chat session must belong to a user']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Session title cannot exceed 100 characters'],
    default: 'AI Tutor Session'
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      model: String,
      tokens: Number,
      responseTime: Number
    }
  }],
  context: {
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal'
    },
    journey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey'
    },
    activeModule: {
      type: String,
      default: null
    },
    userLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    }
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'archived'],
    default: 'active'
  },
  statistics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    userMessages: {
      type: Number,
      default: 0
    },
    aiMessages: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for session duration
chatSessionSchema.virtual('duration').get(function() {
  if (this.createdAt && this.statistics.lastActivity) {
    return this.statistics.lastActivity - this.createdAt;
  }
  return 0;
});

// Virtual for average messages per day
chatSessionSchema.virtual('messagesPerDay').get(function() {
  if (this.createdAt && this.statistics.totalMessages > 0) {
    const days = Math.max(1, (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
    return Math.round(this.statistics.totalMessages / days);
  }
  return 0;
});

// Pre-save middleware to update statistics
chatSessionSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.statistics.totalMessages = this.messages.length;
    this.statistics.userMessages = this.messages.filter(m => m.role === 'user').length;
    this.statistics.aiMessages = this.messages.filter(m => m.role === 'assistant').length;
    this.statistics.totalTokens = this.messages.reduce((total, msg) => {
      return total + (msg.metadata?.tokens || 0);
    }, 0);
    
    // Calculate average response time
    const aiMessages = this.messages.filter(m => m.role === 'assistant' && m.metadata?.responseTime);
    if (aiMessages.length > 0) {
      this.statistics.averageResponseTime = aiMessages.reduce((total, msg) => {
        return total + msg.metadata.responseTime;
      }, 0) / aiMessages.length;
    }
    
    this.statistics.lastActivity = new Date();
  }
  next();
});

// Static method to get user's active session
chatSessionSchema.statics.getActiveSession = async function(userId) {
  return await this.findOne({ 
    user: userId, 
    status: 'active',
    isActive: true 
  }).sort({ updatedAt: -1 });
};

// Static method to create new session
chatSessionSchema.statics.createSession = async function(userId, context = {}) {
  const session = new this({
    user: userId,
    context: context,
    messages: []
  });
  
  await session.save();
  return session;
};

// Instance method to add message
chatSessionSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    timestamp: new Date(),
    metadata
  });
  return this.save();
};

// Instance method to get recent messages
chatSessionSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit);
};

// Instance method to pause session
chatSessionSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

// Instance method to resume session
chatSessionSchema.methods.resume = function() {
  this.status = 'active';
  this.statistics.lastActivity = new Date();
  return this.save();
};

// Instance method to complete session
chatSessionSchema.methods.complete = function() {
  this.status = 'completed';
  this.statistics.lastActivity = new Date();
  return this.save();
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);