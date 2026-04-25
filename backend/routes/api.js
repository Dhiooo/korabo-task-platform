const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const groupController = require('../controllers/groupController');
const taskController = require('../controllers/taskController');
const assessmentController = require('../controllers/assessmentController');
const activityController = require('../controllers/activityController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Auth Routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Group Routes
router.post('/groups', auth, groupController.createGroup);
router.post('/groups/join', auth, groupController.joinGroup);
router.get('/groups', auth, groupController.getMyGroups);
router.get('/groups/:groupId/members', auth, groupController.getGroupMembers);
router.put('/groups/:groupId', auth, groupController.updateGroup);
router.delete('/groups/:groupId', auth, groupController.deleteGroup);
router.post('/groups/:groupId/leave', auth, groupController.leaveGroup);

// Task Routes
router.post('/tasks', auth, taskController.createTask);
router.get('/tasks/:groupId', auth, taskController.getGroupTasks);
router.put('/tasks/:taskId/status', auth, upload.single('proof'), taskController.updateTaskStatus);
router.put('/tasks/:taskId/assign', auth, taskController.assignTask);
router.delete('/tasks/:taskId', auth, taskController.deleteTask);

// Activity Logs
router.get('/activities/:groupId', auth, activityController.getGroupActivities);
router.delete('/activities/:groupId', auth, activityController.clearGroupActivities);


// Assessment Routes
router.post('/assessments', auth, assessmentController.submitAssessment);
router.get('/reports/:groupId', auth, assessmentController.getReport);

module.exports = router;
