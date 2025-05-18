import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Draft', 'In Progress', 'Editing', 'Done'],
    default: 'Draft'
  },
  type: {
    type: String,
    enum: ['Main Task', 'Secondary Task', 'Tertiary Task'],
    default: 'Main Task'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  subtasks: [subtaskSchema],
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  comments: {
    type: Number,
    default: 0
  },
  files: {
    type: Number,
    default: 0
  },
  starred: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    trim: true
  },
  timeTracking: {
    timeSpent: {
      type: Number,
      default: 0
    },
    isRunning: {
      type: Boolean,
      default: false
    },
    lastStarted: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Add index for faster queries
taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
