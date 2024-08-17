'use strict';
const { GetDTO } = require( '../user/user.dto' );

class LoginRequestDTO {
    constructor( { ...props } ) {
        this.email = props.email ? props.email.toLowerCase() : undefined;
        this.password = props.password;
        this.username = props.username;
        this.role = props.role;

        const requiredFields = ['email', 'password'];

        const missingFields = requiredFields.filter(field => !props[field]);
        if (missingFields.length > 0) {
            throw new Error(`${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'} required`);
        }
        
        Object.freeze( this );
    }
}

class LoginResponseDTO {
    constructor( { ...props } ) {
        this.token = props.token;
        this.user = new GetDTO( props.user );
        Object.freeze( this );
    }
}

class RegisterRequestDTO {
    constructor( { ...props } ) {
        this.email = props.email ? props.email.toLowerCase() : undefined;
        this.username = props.username;
        this.role = props.role;
        this.password = props.password;

        const requiredFields = ['email', 'password'];

        const missingFields = requiredFields.filter(field => !props[field]);
        if (missingFields.length > 0) {
            throw new Error(`${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'} required`);
        }

        // Delete Fields which are not present in data
        Object.keys( this ).forEach( key => {
            if ( this[ key ] === undefined ) {
                delete this[ key ];
            }
        } );
        
        Object.freeze( this );
    }
}

class RegisterResponseDTO extends GetDTO {
    constructor( { ...props } ) {
        super( props );
    }
}

class JWTSignDTO {
    constructor( { ...props } ) {
        this._id = props._id.toString();
        this.email = props.email;
        this.name = props.name;
        Object.freeze( this );
    }
}

module.exports = { LoginRequestDTO, LoginResponseDTO, RegisterRequestDTO, RegisterResponseDTO, JWTSignDTO };
