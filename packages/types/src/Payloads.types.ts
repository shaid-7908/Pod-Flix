export interface UserPayload{
    user_name:string,
    user_email:string,
    user_id:string
}

export interface JwtPayload{
    user_id:string,
    user_email:string,
    user_name:string,
}