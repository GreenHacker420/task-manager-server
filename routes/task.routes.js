import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import Task from '../models/task.model.js';

const router = express.Router();

// Apply authentication middleware to all task routes
router.use(authenticate);

// @route   GET /api/tasks
// @desc    Get all tasks for the current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;
    
    // Build query
    const query = { createdBy: req.user._id };
    
    // Add filters if provided
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 });
      
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid task ID')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const task = await Task.findById(req.params.id)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar');
        
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user has access to this task
      if (task.createdBy._id.toString() !== req.user._id.toString() && 
          (!task.assignedTo || task.assignedTo._id.toString() !== req.user._id.toString())) {
        return res.status(403).json({ message: 'Not authorized to access this task' });
      }
      
      res.json(task);
    } catch (error) {
      console.error('Get task error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('status')
      .optional()
      .isIn(['Draft', 'In Progress', 'Editing', 'Done'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['Low', 'Medium', 'High', 'Urgent'])
      .withMessage('Invalid priority'),
    body('type')
      .optional()
      .isIn(['Main Task', 'Secondary Task', 'Tertiary Task'])
      .withMessage('Invalid task type')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        title,
        description,
        status,
        type,
        priority,
        tags,
        dueDate,
        assignedTo,
        category,
        subtasks
      } = req.body;

      // Create new task
      const newTask = new Task({
        title,
        description,
        status: status || 'Draft',
        type: type || 'Main Task',
        priority: priority || 'Medium',
        tags: tags || [],
        dueDate,
        assignedTo,
        category,
        createdBy: req.user._id,
        subtasks: subtasks || [],
        progress: 0
      });

      // Save task
      const task = await newTask.save();
      
      // Populate user fields
      await task.populate('createdBy', 'name email avatar');
      if (task.assignedTo) {
        await task.populate('assignedTo', 'name email avatar');
      }
      
      res.status(201).json(task);
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('status')
      .optional()
      .isIn(['Draft', 'In Progress', 'Editing', 'Done'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['Low', 'Medium', 'High', 'Urgent'])
      .withMessage('Invalid priority'),
    body('type')
      .optional()
      .isIn(['Main Task', 'Secondary Task', 'Tertiary Task'])
      .withMessage('Invalid task type')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find task
      let task = await Task.findById(req.params.id);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user has permission to update this task
      if (task.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }
      
      // Update task fields
      const updateFields = { ...req.body };
      delete updateFields._id; // Ensure _id is not modified
      
      // Update task
      task = await Task.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true }
      )
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');
      
      res.json(task);
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid task ID')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find task
      const task = await Task.findById(req.params.id);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user has permission to delete this task
      if (task.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this task' });
      }
      
      // Delete task
      await Task.findByIdAndDelete(req.params.id);
      
      res.json({ message: 'Task deleted' });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/tasks/:id/subtasks
// @desc    Add a subtask to a task
// @access  Private
router.post(
  '/:id/subtasks',
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    body('text').notEmpty().withMessage('Subtask text is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find task
      const task = await Task.findById(req.params.id);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user has permission to update this task
      if (task.createdBy.toString() !== req.user._id.toString() && 
          (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString())) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }
      
      // Create new subtask
      const newSubtask = {
        text: req.body.text,
        completed: false,
        authorId: req.user._id
      };
      
      // Add subtask to task
      task.subtasks.push(newSubtask);
      
      // Update progress
      const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
      task.progress = task.subtasks.length > 0 
        ? Math.round((completedSubtasks / task.subtasks.length) * 100) 
        : 0;
      
      // Save task
      await task.save();
      
      res.status(201).json(task);
    } catch (error) {
      console.error('Add subtask error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/tasks/:taskId/subtasks/:subtaskId
// @desc    Update a subtask
// @access  Private
router.put(
  '/:taskId/subtasks/:subtaskId',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    param('subtaskId').isMongoId().withMessage('Invalid subtask ID'),
    body('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
    body('text').optional().notEmpty().withMessage('Text cannot be empty')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find task
      const task = await Task.findById(req.params.taskId);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user has permission to update this task
      if (task.createdBy.toString() !== req.user._id.toString() && 
          (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString())) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }
      
      // Find subtask
      const subtaskIndex = task.subtasks.findIndex(
        subtask => subtask._id.toString() === req.params.subtaskId
      );
      
      if (subtaskIndex === -1) {
        return res.status(404).json({ message: 'Subtask not found' });
      }
      
      // Update subtask
      if (req.body.text !== undefined) {
        task.subtasks[subtaskIndex].text = req.body.text;
      }
      
      if (req.body.completed !== undefined) {
        task.subtasks[subtaskIndex].completed = req.body.completed;
      }
      
      // Update progress
      const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
      task.progress = task.subtasks.length > 0 
        ? Math.round((completedSubtasks / task.subtasks.length) * 100) 
        : 0;
      
      // Save task
      await task.save();
      
      res.json(task);
    } catch (error) {
      console.error('Update subtask error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/tasks/:taskId/subtasks/:subtaskId
// @desc    Delete a subtask
// @access  Private
router.delete(
  '/:taskId/subtasks/:subtaskId',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    param('subtaskId').isMongoId().withMessage('Invalid subtask ID')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find task
      const task = await Task.findById(req.params.taskId);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user has permission to update this task
      if (task.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }
      
      // Remove subtask
      task.subtasks = task.subtasks.filter(
        subtask => subtask._id.toString() !== req.params.subtaskId
      );
      
      // Update progress
      const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
      task.progress = task.subtasks.length > 0 
        ? Math.round((completedSubtasks / task.subtasks.length) * 100) 
        : 0;
      
      // Save task
      await task.save();
      
      res.json(task);
    } catch (error) {
      console.error('Delete subtask error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
