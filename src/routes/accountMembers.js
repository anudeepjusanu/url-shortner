const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  requireOwnerOrAnyProjectAdmin,
  requireAccountOwner,
} = require("../middleware/projectAccess");
const accountMemberController = require("../controllers/accountMemberController");

router.use(authenticate);

// Accepting an invite can be the very first thing a user does for this
// account, so it deliberately has no organization/role guard beyond auth.
router.post(
  "/invitations/:token/accept",
  accountMemberController.acceptInvitation,
);

router.get(
  "/members",
  requireOwnerOrAnyProjectAdmin,
  accountMemberController.getOverview,
);
router.get(
  "/members/:userId",
  requireOwnerOrAnyProjectAdmin,
  accountMemberController.getMemberDetail,
);
router.delete(
  "/members/:userId",
  requireAccountOwner,
  accountMemberController.removeFromAccount,
);

router.post(
  "/invitations",
  requireOwnerOrAnyProjectAdmin,
  accountMemberController.inviteMember,
);
router.delete(
  "/invitations/:invitationId",
  requireOwnerOrAnyProjectAdmin,
  accountMemberController.cancelInvitation,
);

module.exports = router;
