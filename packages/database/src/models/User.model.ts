import {Schema,model} from 'mongoose'
import {UserDocument} from '@shared/types'

const UserSchema = new Schema<UserDocument>({
    user_name:{
        type:String,
        unique:true
    },
    user_email:{
        type:String,

    },
    user_first_name:{
        type:String,
    },
    user_last_name:{
        type:String
    },
    user_profile_picture:{
        type:String
    },
    user_password:{
        type:String
    },
    refresh_token:{
        type:String,
        default:''
    },
    verified_status:{
        type:Boolean,
        default:false
    }
})

export const UserModel = model<UserDocument>('users',UserSchema)