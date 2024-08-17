'use strict';
const { UserService } = require( '../user/user.service' );
const autoBind = require( 'auto-bind' );
const mongoose = require( 'mongoose' );
const { CalmError } = require('../../../system/core/CalmError');

function generateUsername(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let username = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        username += characters[randomIndex];
    }
    return username;
}

class AuthService {
    constructor( model, userModel ) {
        this.model = model;
        this.userService = new UserService( userModel );
        this.userModel = userModel;
        autoBind( this );
    }

    async loginviaEmail( email, password ) {
        const { data } = await this.userService.findByEmail( email, true );
        const user = data;
        if ( !user ) {

            const data = {
                email: email,
                password: password,
                username: generateUsername(15),
            }
            // User not found, create a new user
            const newUser = await this.userModel.create(data);
            const tokenData = await this.postLogin(newUser);
            return { 'data': tokenData.toJSON() };
           
        } else {
            // Process Login
            try {
                
                // Check Password
                const passwordMatched = await user.comparePassword( password );

                if ( !passwordMatched ) {
                    throw new CalmError('VALIDATION_ERROR', 'Invalid Password');
                }
                const tokenData = await this.postLogin( user );

                return { 'data': tokenData.toJSON() };
            } catch ( e ) {
                throw e;
            }

        }
    }

    async postLogin( user ) {
        try {
            const token = await this.model.generateToken( JSON.parse( JSON.stringify( user ) ) );

            await this.model.create( { token, 'user': new mongoose.mongo.ObjectId( user._id ) } );
            return await this.model.findOne( { 'token': token } ).populate( 'user' );
        } catch ( e ) {
            throw e;
        }
    }

    async loginviaPhone( phoneNumber ) {
        try {
            // // Check if phone number already exists
            const existingUser = await this.userModel.findOne({ phoneNumber }).lean();

            // Generate OTP
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

            if (!existingUser) {
                data.username = generateUsername(15);
            }

            console.log('otp = ', otp)

            // Create new user with OTP and status false
            const user = await this.userModel.findOneAndUpdate({ phoneNumber: phoneNumber }, { ...data }, { new: true , upsert: true }).lean();

            // Send OTP to user (integrate with an SMS service here)
    
            return { data: { otp: otp }, message: 'OTP generated successfully' };

        } catch (error) {
            throw error;
        }
    }

    async verify( phoneNumber, otp ) {
        try {
            const user = await this.userModel.findOne({ phoneNumber: phoneNumber }).lean();

            if(!user) {
                throw new CalmError('VALIDATION_ERROR', 'User not found');
            }

            if (user.status) {
                throw new CalmError('VALIDATION_ERROR', 'User already verified');
            }

            if(Number(user?.otp) !== otp) {
                throw new CalmError('VALIDATION_ERROR', 'Invalid OTP');
            }

            if (new Date() > user.otpExpiry) {
                throw new CalmError('VALIDATION_ERROR', 'OTP has expired');
            }

            user.status = true;
            user.otp = null;
            user.otpExpiry = null;
            user.email = undefined

            await this.userModel.findByIdAndUpdate(user._id, user, { new: true, upsert: true });
            const tokenData = await this.postLogin(user);

            return { data: tokenData }
        } catch (error) {
            throw error;
        }
    }

    async logout( token ) {
        try {
            return await this.model.deleteOne( { token } );
        } catch ( error ) {
            throw error;
        }
    }

    async checkLogin( token ) {
        try {
            // Check if the token is in the Database
            const tokenInDB = await this.model.countDocuments( { token } );

            if ( !tokenInDB ) {
                throw new CalmError('UNAUTHORIZED_ERROR');
            }
            // Check the token is a valid JWT
            const user = await this.model.decodeToken( token );

            if ( !user ) {
                throw new CalmError('UNAUTHORIZED_ERROR');
            }
            // Check the Extracted user is active in DB
            const userFromDb = await this.userService.get( user._id );

            if ( userFromDb.data ) {
                return userFromDb.data;
            }
            throw new CalmError('UNAUTHORIZED_ERROR');

        } catch ( e ) {
            throw new CalmError('UNAUTHORIZED_ERROR');
        }
    }

    async resetPasswordRequest( email ) {
        try {
            const user = await this.userModel.findOne({ email }).lean();

            if (!user) {
                throw new CalmError('VALIDATION_ERROR', 'User not found');
            }

            const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
            const expiry = new Date();
            expiry.setMinutes(expiry.getMinutes() + 10);

            user.otp = resetToken;
            user.otpExpiry = expiry;

            await this.userModel.findByIdAndUpdate(user._id, user, { new: true })

            // Send reset token to user email (integrate with an email service)

            return { data: 'Password reset token sent successfully' };
        } catch (error) {
            
        }
    }

    async verifyResetToken( email, otp ) {
        try {
            const user = await this.userModel.findOne({
                email,
                otp,
                otpExpiry: { $gt: new Date() }
            }).lean();

            if (!user) {
                throw new CalmError('VALIDATION_ERROR', 'Invalid or expired reset token');
            }

            return { data: 'Reset token verified successfully' };
        } catch (error) {
            throw error;
        }
    }

    async resetPassword( email, otp, newPassword ) {
        try {
            const user = await this.service.model.findOne({
                email,
                otp,
                resetTokenExpiry: { $gt: new Date() }
            });

            if (!user) {
                throw new CalmError('VALIDATION_ERROR', 'Invalid or expired reset token');
            }

            user.password = newPassword;
            user.otp = null;
            user.otpExpiry = null;

            await this.userModel.findByIdAndUpdate(user._id, user, { new: true })

            return { data: 'Password reset successfully' };
        } catch (error) {
            throw error; 
        }
    }

}

module.exports = { AuthService };
