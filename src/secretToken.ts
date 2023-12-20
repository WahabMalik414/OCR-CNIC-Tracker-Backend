import jwt from "jsonwebtoken"

export default function createSecretToken(id:string){
    return jwt.sign({id}, "CNsi*SNDk")
}