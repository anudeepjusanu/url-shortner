const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireAccountOwner, requireProjectRole } = require('../middleware/projectAccess');
const projectController = require('../controllers/projectController');

router.use(authenticate);

router.get('/', projectController.listProjects);
router.post('/', requireAccountOwner, projectController.createProject);

router.get(
  '/:projectId',
  requireProjectRole(['owner', 'admin', 'editor', 'viewer', 'personal-owner']),
  projectController.getProject
);
router.get('/:projectId/members', requireProjectRole(['owner', 'admin']), projectController.listProjectMembers);
router.post('/:projectId/members', requireProjectRole(['owner', 'admin']), projectController.addExistingUserToProject);
router.put('/:projectId/members/:userId', requireProjectRole(['owner', 'admin']), projectController.changeMemberRole);
router.delete('/:projectId/members/:userId', requireProjectRole(['owner', 'admin']), projectController.removeMember);

module.exports = router;
