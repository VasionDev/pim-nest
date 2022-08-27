import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { CreateRoleDto } from './dto';
import { Role } from './interface';

@Injectable()
export class RoleService {

    constructor(
        @InjectModel('Role') private roleModel: Model<Role>,
        private readonly userService: UserService
    ){}

    async roleList(): Promise<Role[]> {
        try {
            const roles = await this.roleModel.find().sort({name:1}).populate('users').exec()
            const returnData = roles.map(role=> ({
                id: role.id,
                name: role.name,
                systemAdmin: role.systemAdmin,
                dashboard: role.dashboard,
                products: role.products,
                collections: role.collections,
                priceList: role.priceList,
                users: role.users.map((user: any)=>({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                }))
            }))
            return returnData as Role[]
        }catch(error) {
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async addRole(roleData: CreateRoleDto): Promise<Role> {
        try {
            const newRole = new this.roleModel({
                ...roleData
            })
            const role = await newRole.save()
            const returnData = {
                id: role.id,
                name: role.name,
                systemAdmin: role.systemAdmin,
                dashboard: role.dashboard,
                products: role.products,
                collections: role.collections,
                priceList: role.priceList
            }
            return returnData as Role
        }catch(error) {
            if(error.code == '11000') {
                throw new HttpException('Role name already exist', HttpStatus.CONFLICT)
            }
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
    
    async roleById(roleId: string): Promise<Role> {
        try {
            const role = await this.roleModel.findById(roleId).exec()
            if(role != null) {
                const returnData = {
                    id: role.id,
                    name: role.name,
                    systemAdmin: role.systemAdmin,
                    dashboard: role.dashboard,
                    products: role.products,
                    collections: role.collections,
                    priceList: role.priceList,
                    users: role.users.map((user: any)=>({
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email
                    }))
                }
                return returnData as Role
            }
            throw new HttpException('Role not found', HttpStatus.NOT_FOUND)
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

    async editRole(roleId: string, roleData: CreateRoleDto): Promise<Role> {
        try {
            const role = await this.roleModel.findByIdAndUpdate(roleId, {
                ...roleData
            }, {new: true}).exec()
            if(role != null) {
                const returnData = {
                    id: role.id,
                    name: role.name,
                    systemAdmin: role.systemAdmin,
                    dashboard: role.dashboard,
                    products: role.products,
                    collections: role.collections,
                    priceList: role.priceList
                }
                return returnData as Role
            }
            throw new HttpException('Role not found', HttpStatus.NOT_FOUND)
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

    async deleteRole(roleId: string): Promise<string> {
        try {
            const role = await this.roleModel.findByIdAndDelete(roleId).exec()
            if(role != null) {
                await this.userService.setNullToUserRoleByRoleId(role.id)
                return `${role.name} role has been deleted successfully`
            }
            throw new HttpException('Role not found', HttpStatus.NOT_FOUND)
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
}
