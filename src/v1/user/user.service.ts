import { HttpException, HttpStatus, Injectable, Inject, forwardRef } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as bcrypt from 'bcrypt';
import * as argon2 from "argon2";
import { ConfirmInvitationDto, CreateUserDto, UpdateUserDto, UserProfileDto, UserSettingsDto } from "./dto";
import { User } from "./interface";
import { Team } from "../team/interface";
import { Role } from "../role/interface";
import { CommonService } from "src/common/common.service";
import { TokenService } from "../auth/token/token.service";
import { MailService } from "src/mail/mail.service";
import { userStatus } from "./enum";

@Injectable()
export class UserService {
    constructor(
        @InjectModel('User') private userModel: Model<User>,
        @InjectModel('Team') private teamModel: Model<Team>,
        @InjectModel('Role') private roleModel: Model<Role>,
        @Inject(forwardRef(() => TokenService))
        private readonly tokenService: TokenService,
        private readonly commonService: CommonService,
        private readonly mailService: MailService
    ) {}

    async createSuperUser(): Promise<string> {
        try {
            const superUser = await this.userModel.findOne({email: 'omicronit.work@gmail.com'}).exec()
            if(superUser != null) {
                throw new HttpException('Super user already exist', HttpStatus.CONFLICT)
            }
            const encodedPassword = await bcrypt.hash(process.env.SUPER_USER_PASSWORD, 10)
            const newSuperUser = new this.userModel({
                firstName: 'Omicron',
                lastName: 'IT',
                email: process.env.SUPER_USER_EMAIL,
                password: encodedPassword,
                superAdmin: true
            })

            await newSuperUser.save()
            return 'Super user has been created'
        }catch(error) {
            if(error.status == 409) {
                throw new HttpException('Super user already exist', HttpStatus.CONFLICT)
            }
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
        
    }
    
    async getUsers(): Promise<User[]> {
        try {
            const users = await this.userModel.find().sort({firstName:1}).exec()
            const returnData = users.map(user=> ({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                superAdmin: user.superAdmin,
                teams: user.teams,
                avatar: user.avatar,
                status: user.status
            })) as User[]
            return returnData
        }catch(error) {
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async addUser(userData: CreateUserDto): Promise<User> {
        try {
            if(userData.password) {
                userData.password = await bcrypt.hash(userData.password, 10)
                delete userData['passwordConfirm']
            }
            const user = new this.userModel({
                ...userData
            })
            const createdUser  = await user.save()
            await this.teamModel.updateMany({'_id': createdUser.teams}, {$push: {users: createdUser.id}})
            await this.roleModel.updateOne({'_id': createdUser.role}, {$push: {users: createdUser.id}})
            const returnData = {
                id: createdUser.id,
                firstName: createdUser.firstName,
                lastName: createdUser.lastName,
                email: createdUser.email
            }
            return returnData as User
        }catch(error) {
            if(error.code == '11000') {
                throw new HttpException('Email should be unique', HttpStatus.CONFLICT)
            }else if(error.kind == 'ObjectId' || error.name == 'ValidationError') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST)
            }else {
                throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
    }

    async getUser(userId: string): Promise<User> {
        try {
            const user = await this.userModel.findById(userId).populate({path: 'role', select: '-_id -__v -users'}).exec()
            if(user != null) {
                const returnData = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    superAdmin: user.superAdmin,
                    teams: user.teams,
                    avatar: user.avatar,
                    status: user.status
                }
                return returnData as User
            }
            throw new HttpException('User not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            if(error.status == 404) {
                throw new HttpException('Not found', HttpStatus.NOT_FOUND)
            }else if(error.kind == 'ObjectId' || error.name == 'ValidationError') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST)
            }else {
                throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
    }

    async getUserByEmailId(email: string): Promise<User> {
        try {
            const user = await this.userModel.findOne({email: email}).exec()
            if(user != null) {
                const returnData = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    superAdmin: user.superAdmin,
                    teams: user.teams,
                    avatar: user.avatar,
                    status: user.status
                }
                return returnData as User
            }
            throw new HttpException('User not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            throw new HttpException(error, error?.status)
        }
    }

    async validateUser(email: string, password: string) {
        try {
            const user = await this.userModel.findOne({email: email}).exec()
            if(!user) throw new HttpException('Authentication error', HttpStatus.FORBIDDEN)
            const matched = await bcrypt.compare(password, user.password)
            if(!matched) throw new HttpException('Authentication error', HttpStatus.FORBIDDEN)
            const returnData = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            } as User
            return returnData
        }catch(error) {
            if(error.status == 403) {
                throw new HttpException('Authentication error', HttpStatus.FORBIDDEN)
            }
            throw new HttpException('something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async editUser(userId: string, userData: UpdateUserDto) {
        try {
            const user = await this.userModel.findById(userId).exec()
            if(user != null) {
                const prevTeamIds = user.teams.map((team: any)=>team.toString())
                const newTeamIds= userData.teams || null
                const newRoleId = userData.role || null
                const prevRoleId = user.role ? user.role.toString() : ''
                if(userData.password) {
                    userData.password = await bcrypt.hash(userData.password, 10)
                    delete userData['passwordConfirm']
                }
                const updateUser = await this.userModel.findByIdAndUpdate(userId, {
                    ...userData
                }, {new: true}).exec()
                if(Array.isArray(newTeamIds)) {
                    const {add, remove} = await this.commonService.changeable_ids(newTeamIds, prevTeamIds)
                    if(add.length) await this.teamModel.updateMany({'_id': add}, {$addToSet: {users: updateUser.id}})
                    if(remove.length) await this.teamModel.updateMany({'_id': remove}, {$pull: {users: updateUser.id}})
                }
                if(newRoleId != null && newRoleId !== prevRoleId) {
                    if(newRoleId) await this.roleModel.updateOne({'_id': newRoleId}, {$addToSet: {users: updateUser.id}})
                    if(prevRoleId) await this.roleModel.updateOne({'_id': prevRoleId}, {$pull: {users: updateUser.id}})
                }
                const returnData = {
                    id: updateUser.id,
                    firstName: updateUser.firstName,
                    lastName: updateUser.lastName,
                    email: updateUser.email,
                    role: updateUser.role,
                    superAdmin: updateUser.superAdmin,
                    teams: updateUser.teams,
                    avatar: updateUser.avatar,
                    status: updateUser.status
                }
                return returnData as User
            }
            throw new HttpException('User not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            if(error.status == 404) {
                throw new HttpException('Not found', HttpStatus.NOT_FOUND)
            }else if(error.kind == 'ObjectId' || error.name == 'ValidationError') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST)
            }else {
                throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
    }

    async userSettings(userId: string, userData: UserSettingsDto) {
        try {
            const user = await this.userModel.findById(userId).exec()
            if(user != null) {
                const prevTeamIds = user.teams.map((team: any)=>team.toString())
                const newTeamIds= userData.teams || null
                const newRoleId = userData.role || null
                const prevRoleId = user.role ? user.role.toString() : ''

                const updateUser = await this.userModel.findByIdAndUpdate(userId, {
                    ...userData
                }, {new: true}).exec()
                if(Array.isArray(newTeamIds)) {
                    const {add, remove} = await this.commonService.changeable_ids(newTeamIds, prevTeamIds)
                    if(add.length) await this.teamModel.updateMany({'_id': add}, {$addToSet: {users: updateUser.id}})
                    if(remove.length) await this.teamModel.updateMany({'_id': remove}, {$pull: {users: updateUser.id}})
                }

                if(newRoleId != null && newRoleId !== prevRoleId) {
                    if(newRoleId) await this.roleModel.updateOne({'_id': newRoleId}, {$addToSet: {users: updateUser.id}})
                    if(prevRoleId) await this.roleModel.updateOne({'_id': prevRoleId}, {$pull: {users: updateUser.id}})
                }

                const returnData = {
                    id: updateUser.id,
                    email: updateUser.email,
                    role: updateUser.role,
                    teams: updateUser.teams,
                }
                return returnData as User
            }
            throw new HttpException('User not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            if(error.status == 404) {
                throw new HttpException('Not found', HttpStatus.NOT_FOUND)
            }else if(error.kind == 'ObjectId' || error.name == 'ValidationError') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST)
            }else {
                throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
    }

    async updateUserProfile(userId: string | Types.ObjectId, userData: UserProfileDto) {
        try {
            const user = await this.userModel.findById(userId).exec()
            if(user != null) {
                if(userData.password) {
                    userData.password = await bcrypt.hash(userData.password, 10)
                    delete userData['passwordConfirm']
                }
                const updateUser = await this.userModel.findByIdAndUpdate(userId, {
                    ...userData
                }, {new: true}).exec()
                const returnData = {
                    id: updateUser.id,
                    firstName: updateUser.firstName,
                    lastName: updateUser.lastName,
                    email: updateUser.email,
                    avatar: updateUser.avatar,
                }
                return returnData as User
            }
            throw new HttpException('User not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            if(error.status == 404) {
                throw new HttpException('Not found', HttpStatus.NOT_FOUND)
            }else if(error.kind == 'ObjectId' || error.name == 'ValidationError') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST)
            }else {
                throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
    }

    async changePassword(userId: string, password: string): Promise<void> {
        try {
            const hashed = await bcrypt.hash(password, 10)
            await this.userModel.updateOne({'_id': userId}, {$set: {password: hashed}}).exec()
        }catch(error) {
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleteUser(userId: string): Promise<string> {
        try {
            const user = await this.userModel.findById(userId).exec()
            if(user != null) {
                await this.teamModel.updateMany({'_id': user.teams}, {$pull: {users: user.id}})
                await this.roleModel.updateOne({'_id': user.role}, {$pull: {users: user.id}})
                if(user.superAdmin) throw new HttpException("You don't have the permission", HttpStatus.UNAUTHORIZED)
                await this.userModel.findByIdAndDelete(userId).exec()
                return `${user.firstName} ${user.lastName} user has been deleted successfully`
            }
            throw new HttpException('User not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            if(error.status == 401) {
                throw new HttpException("You don't have the permission", HttpStatus.UNAUTHORIZED)
            }
            else if(error.status == 404) {
                throw new HttpException('Not found', HttpStatus.NOT_FOUND)
            }else if(error.kind == 'ObjectId' || error.name == 'ValidationError') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST)
            }else {
                throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
    }

    async setNullToUserRoleByRoleId(roleId: string | Types.ObjectId): Promise<void>{
        try {
            await this.userModel.updateMany({role: roleId}, {$set: {role: null}})
        }catch(error) {
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getUsersByRoleId(roleId: string): Promise<User[]> {
        try {
            const users = await this.userModel.find({role: roleId})
            const returnData = users.map(user=> ({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status
            })) as User[]
            return returnData
        }catch(error) {
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
    
    async setRefreshToken(userId: string | Types.ObjectId, rfToken: string): Promise<void> {
        try {
            const hashedToken = await argon2.hash(rfToken)
            await this.userModel.findByIdAndUpdate(userId, {refreshToken: hashedToken}).exec()
        }catch(error) {
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getRefreshToken(userId: string) {
        try {
            const user = await this.userModel.findById(userId).select('refreshToken email').exec()
            return {id: user.id, email: user.email, refreshToken: user.refreshToken}
        }catch(error) {
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async userInvitation(createData: CreateUserDto, user: User): Promise<string> {

        let userId: string | Types.ObjectId
        if(user !== undefined) {
            userId = user.id
            await this.userModel.updateOne({_id: userId}, {$set: {status: userStatus.invited}})
        }else {
            const newUser = await this.addUser(createData)
            userId = newUser.id
        }
        const token = await this.tokenService.getUserToken(userId)
        const link = `${process.env.BASE_URL}/invitation/?id=${userId}&token=${token.token}`
        const {accepted} = await this.mailService.sendInvitation(createData.email, "PIM Invitation", link)
        if(Array.isArray(accepted) && accepted.length){
            return 'Invitation link sent to the email account'
        }
        throw new HttpException('An error occured', HttpStatus.INTERNAL_SERVER_ERROR)
    }

    async confirmInvitation(userId: string, token: string, invitedUser: ConfirmInvitationDto): Promise<string> {
        const isValid = await this.tokenService.validateToken(userId, token)
        if(!isValid) throw new HttpException('Invalid link or expired', HttpStatus.BAD_REQUEST)
        invitedUser.password = await bcrypt.hash(invitedUser.password, 10)
        delete invitedUser['passwordConfirm']
        await this.userModel.findByIdAndUpdate(userId, {
            ...invitedUser,
            status: userStatus.active
        })
        await this.tokenService.deleteToken(userId, token)
        return 'User invitation has been confirmed'
    }

    async rollbackInvitation(id: string): Promise<string> {
        try {
            const user = await this.userModel.findById(id).exec()
            if(user && user.status === 'invited') {
                user.status = userStatus.invitation_cancelled
                await user.save()
                await this.tokenService.deleteTokenByUserId(id)
                return 'Invitation cancelled'
            }
            return 'Not a invited user'
        }catch(error) {
            throw new HttpException(error, error?.status)
        }
    }

    async userDataOrNull(uniqueId: string | Types.ObjectId) {
        try {
            const queryFilter: object[] = [{email: uniqueId}]
            if(Types.ObjectId.isValid(uniqueId)) queryFilter.push({_id: uniqueId})
            const user = await this.userModel.findOne({
                $or: queryFilter
            })
            if(user !== null) {
                const returnData = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    superAdmin: user.superAdmin,
                    teams: user.teams,
                    avatar: user.avatar,
                    status: user.status
                }
                return returnData as User
            }
            return null
        }catch(error) {
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}