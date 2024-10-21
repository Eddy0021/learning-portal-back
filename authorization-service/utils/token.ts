import exp from "constants";
import * as jwt from "jsonwebtoken";

export const generateToken = (user_id: any) => {
    return jwt.sign({ user_id: user_id }, process.env.TOKEN_KEY, { expiresIn: '2h' });;
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, process.env.TOKEN_KEY, (error: any) =>{
        if (error){
            return{
                verified: false
            }
        }

        return{
            verified: true
        }
    })
}
