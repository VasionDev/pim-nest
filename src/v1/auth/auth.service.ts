import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Types } from "mongoose";
import { MailService } from "src/mail/mail.service";
import { UserService } from "../user/user.service";
import { LoginDto } from "./dto";
import { TokenService } from "./token/token.service";
import { Token } from "./type";

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly tokenService: TokenService,
        private readonly mailService: MailService
    ){}

    async login(loginDto: LoginDto): Promise<Token> {
        const user = await this.userService.validateUser(loginDto.email, loginDto.password)
        return await this.generateTokens(user.id, user.email)
    }

    async superUser() {
        return await this.userService.createSuperUser()
    }

    async generateTokens(userId: string | Types.ObjectId, email: string): Promise<Token> {
        const payload = {sub: userId, email: email}
        const AccessToken = this.jwtService.sign(
            payload,
            {secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN}
        )
        const RefrershToken = this.jwtService.sign(
            payload,
            {secret: process.env.JWT_RT_SECRET, expiresIn: process.env.JWT_RT_EXPIRES_IN}
        )
        await this.userService.setRefreshToken(userId, RefrershToken)
        return {'access_token': AccessToken, 'refresh_token': RefrershToken}
    }

    async resetPassword(email: string): Promise<string> {
        const user = await this.userService.getUserByEmailId(email)
        if(user !== null) {
            const token = await this.tokenService.getUserToken(user.id)
            if(token !== null) {
                const link = `${process.env.BASE_URL}/password-reset/?id=${user.id}&token=${token.token}`
                const {accepted} = await this.mailService.sendResetLink(user.email, "Password reset", link, user.firstName)
                if(Array.isArray(accepted) && accepted.length){
                    return 'Password reset link sent to the email account'
                }
                throw new HttpException('An error occured', HttpStatus.INTERNAL_SERVER_ERROR)
            }
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
        throw new HttpException('Not a valid user', HttpStatus.BAD_REQUEST)
    }

    async managePassword(userId: string, token: string, password: string): Promise<string> {
        const isValid = await this.tokenService.validateToken(userId, token)
        if(!isValid) throw new HttpException('Invalid link or expired', HttpStatus.BAD_REQUEST)
        await this.userService.changePassword(userId, password)
        await this.tokenService.deleteToken(userId, token)
        return 'password reset sucessfully'
    }

    async verifyLink(userId: string, token: string): Promise<boolean> {
        const isValid = await this.tokenService.validateToken(userId, token)
        if(!isValid) throw new HttpException('Invalid link or expired', HttpStatus.BAD_REQUEST)
        return isValid
    }
}