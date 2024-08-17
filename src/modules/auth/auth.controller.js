const { AuthService } = require( './auth.service' );
const { Auth } = require( './auth.model' );
const { User } = require( '../user/user.model' );
const autoBind = require( 'auto-bind' );
const authDTO = require( './auth.dto' );
const userDTO = require( '../user/user.dto' );
const authService = new AuthService( new Auth().getInstance(), new User().getInstance() );

class AuthController {

    constructor( service ) {
        this.service = service;
        this.dto = authDTO;
        this.userDTO = userDTO;
        autoBind( this );
    }

    async loginviaEmail( req, res, next ) {
        try {
            const loginData = new this.dto.LoginRequestDTO( req.body );
            const response = await this.service.loginviaEmail( loginData.email, loginData.password );
            res.sendCalmResponse( new this.dto.LoginResponseDTO( response.data ) );
        } catch ( e ) {
            if (e.message.includes('required')) {
                return res.status(400).json({ message: e.message, statusCode: 400, data: {}, error: true, responseTimestamp: new Date().toISOString() });
            }
            next( e );
        }
    }

    async loginviaPhone(req, res, next) {
        try {
            const { phoneNumber } = req.body;

            const response = await this.service.loginviaPhone( phoneNumber );
            res.sendCalmResponse( response.data, { message: response.message } );
            
        } catch (error) {
            next(error);
        }
    }

    async verify(req, res, next) {
        try {
            const { phoneNumber, otp } = req.body;

            const response = await this.service.verify( phoneNumber, otp );
            res.sendCalmResponse( response.data );
        } catch (error) {
            next(error);
        }
    }

    async logout( req, res, next ) {
        try {
            await this.service.logout( req.token );
            res.sendCalmResponse( null, { 'deleted': true } );
        } catch ( e ) {
            next( e );
        }
    }

    async checkLogin( req, res, next ) {
        try {
            const token = this.extractToken( req );

            req.user = await this.service.checkLogin( token );
            req.authorized = true;
            req.token = token;
            next();
        } catch ( e ) {
            next( e );
        }
    }

    async optionalCheckLogin( req, res, next ) {
        try {
            const token = this.extractToken( req );

            req.user = await this.service.checkLogin( token );
            req.authorized = true;
            req.token = token;
            next();
        } catch ( e ) {
            next();
        }
    }

    async resetPasswordRequest(req, res, next) {
        try {
            const { email } = req.body;

            const response = await this.service.resetPasswordRequest( email );

            res.sendCalmResponse( response.data );
        } catch (error) {
            next( error );
        }
    }

    async verifyResetToken(req, res, next) {
        try {
            const { email, resetToken } = req.body;
            const response = await this.service.verifyResetToken( email, resetToken )

            res.sendCalmResponse( response.data );
        } catch (error) {
            next( error );
        }
    }

    async resetPassword( req, res, next ) {
        try {
            const { email, resetToken, newPassword } = req.body;

            const response = await this.service.resetPassword( email, resetToken, newPassword );
            res.sendCalmResponse( response.data );
        } catch (error) {
            next(error);
        }
    }

    extractToken( req ) {
        if ( req.headers.authorization && req.headers.authorization.split( ' ' )[ 0 ] === 'Bearer' ) {
            return req.headers.authorization.split( ' ' )[ 1 ];
        } else if ( req.query && req.query.token ) {
            return req.query.token;
        }
        return null;
    }

    
}

module.exports = new AuthController( authService );
