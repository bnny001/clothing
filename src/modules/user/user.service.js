'use strict';
const { CalmService } = require( '../../../system/core/CalmService' );
const { Auth } = require('../auth/auth.model');
const mongoose = require( 'mongoose' );
const autoBind = require( 'auto-bind' );
const { CalmError } = require('../../../system/core/CalmError');

class UserService extends CalmService {
    constructor( model ) {
        super( model );
        this.model = model;
        this.authModel = new Auth().getInstance();
        autoBind( this );
    }

    
    async get(id) {
        try {
            const user = await this.model.findById(id).lean();
            return { data: user };
        } catch (error) {
            throw error;
        }
    }

    async update( id, data ) {
        try {

            const user = await this.model.findByIdAndUpdate(id, { $set: {...data } }, { new: true } )

            return { data: user, message: 'User-profile updated successfully.' };
        } catch (error) {
            throw error;
        }
    }

    async updatePhone( user, phoneNumber ) {
        try {
            const getUser = await this.model.findById( user?._id ).lean()

            if( !getUser ) {
                throw new CalmError('UNKNOWN_ERROR');
            }

            const findPhoneNumber = await this.model.findOne({ phoneNumber: phoneNumber }).lean()

            if( findPhoneNumber ) {
                throw new CalmError('VALIDATION_ERROR' ,`User with ${phoneNumber} is already exists!`)
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiry = new Date();
            expiry.setMinutes( expiry.getMinutes() + 5 );

            const data = {
                phoneNumber: phoneNumber,
                otp: otp, 
                otpExpiry: expiry, 
                status: false,
                email: undefined
            }

            await this.model.findByIdAndUpdate(user?._id, { $set: { ...data }}, { new: true });

            return { data: { otp: otp }, message: 'OTP generated successfully' };

        } catch (error) {
            
        }
    }

    async changePassword( id, password, oldPassword ) {
        try {
            const user = await this.model.findById( id ).select('password');

            if(!user) {
                throw new CalmError('VALIDATION_ERROR', 'Invalid User');
            } else {
                try {
                    const oldPasswordMatched = await user.comparePassword( oldPassword );

                    if ( !oldPasswordMatched ) {
    
                        throw new CalmError('VALIDATION_ERROR', 'Invalid Old Password');
                    }

                    return await this.update( id, { password: password } )
                } catch (error) {
                    throw error;
                }
            }

        } catch ( errors ) {
            throw errors;
        }
    }

    async findByEmail( email, includePassword = false ) {
        let data;
        if ( includePassword ) {
            data = await this.model.findByEmail( email ).select( '+password' );
        } else {
            data = await this.model.findByEmail( email );
        }
        return { data };
    }
}

module.exports = { UserService };
