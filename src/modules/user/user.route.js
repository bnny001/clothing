'use strict';
const UserController = require( './user.controller' );
const AuthController = require('../auth/auth.controller');

const express = require( 'express' ),
router = express.Router();

router.use(AuthController.checkLogin)

router.get('/', UserController.get);
router.put('/update-phone', UserController.updatePhone);
router.put('/update-profile', UserController.update);
router.post('/change-password', UserController.changePassword );

module.exports = router;
