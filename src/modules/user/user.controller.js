'use strict';
const { CalmController } = require( '../../../system/core/CalmController' );
const { CalmError } = require('../../../system/core/CalmError');
const { UserService } = require( './user.service' );
const { User } = require( './user.model' );

const userDTO = require( './user.dto' );
const autoBind = require( 'auto-bind' ),
    userService = new UserService(
        new User().getInstance(),
    );

class UserController extends CalmController {
    constructor( service ) {
        super( service );
        this.dto = { ...this.dto, ...userDTO };
        autoBind( this );
    }

    async get(req, res, next) {
        try {
            const id = req.user._id;

            if( !id ) {
                throw new CalmError('UNKNOWN_ERROR')
            }

            const response = await this.service.get(id);
            res.sendCalmResponse(response.data)

        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {

            const id = req.user._id;
            const data = req.body;

            if( !id ) {
                throw new CalmError('UNAUTHORIZED_ERROR')
            }

            const response = await this.service.update(id, data);
            res.sendCalmResponse(response.data, { message: response.message });
        } catch (error) {
            next(error);
        }
    }

    async updatePhone( req, res, next ) {
        try {
            const user = req.user;
            const { phoneNumber } = req.body;

            if( !user ) {
                throw new CalmError('UNAUTHORIZED_ERROR')
            }

            const response = await this.service.updatePhone( user, phoneNumber );
            res.sendCalmResponse( response.data, { message: response.message });

        } catch (error) {
            next( error );
        }
    }

    async changePassword( req, res, next ) {
        try {
            const id = req.user._id;
            await this.service.changePassword( id, req.body.password, req.body.oldPassword );
            res.sendCalmResponse( null, { 'updated': true } );
        } catch ( e ) {
            next( e );
        }
    }
}

module.exports = new UserController( userService );
