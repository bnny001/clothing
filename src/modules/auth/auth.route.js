'use strict';
const AuthController = require( './auth.controller' );
const express = require( 'express' ),
router = express.Router();

router.post('/login', AuthController.loginviaEmail );
router.post('/login-viaPhone', AuthController.loginviaPhone );

router.post( '/verify', AuthController.verify );

router.post('/reset-password-request', AuthController.resetPasswordRequest)
router.post('/verifyToken', AuthController.verifyResetToken)
router.post('/reset-password', AuthController.resetPassword)

router.use(AuthController.checkLogin)

router.delete('/logout', AuthController.logout );


module.exports = router;
