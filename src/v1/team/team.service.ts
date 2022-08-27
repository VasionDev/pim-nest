import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommonService } from 'src/common/common.service';
import { User } from '../user/interface';
import { CreateTeamDto, UpdateTeamDto } from './dto';
import { Team } from './interface';

@Injectable()
export class TeamService {
    constructor(
        @InjectModel('Team') private teamModel: Model<Team>,
        @InjectModel('User') private userModel: Model<User>,
        private readonly commonService: CommonService
    ) {}

    async getTeamList(): Promise<Team[]> {
        try {
            const teams = await this.teamModel.find().sort({name:1}).populate('users').exec()
            const returnData = teams.map(team=> ({
                id: team.id,
                name: team.name,
                users: team.users.map((user: any)=>({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                })),
                products: team.products,
                createdAt: team.createdAt,
                updatedAt: team.updatedAt
            }))
            return returnData as Team[]
        }catch(error) {
            throw new HttpException('something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async addTeam(teamData: CreateTeamDto): Promise<Team> {
        try {
            const newTeam = new this.teamModel({
                ...teamData
            })
            const team = await newTeam.save()
            // await this.userModel.updateMany({'_id': team.users}, {$push: {teams: team.id}})
            const returnData = {
                id: team.id,
                name: team.name,
                users: team.users,
                products: team.products,
                createdAt: team.createdAt,
                updatedAt: team.updatedAt
            }
            return returnData as Team
        }catch(error) {
            if(error.code == '11000') {
                throw new HttpException('Team name already exist', HttpStatus.CONFLICT)
            }else if(error.kind == 'ObjectId' || error.name == 'ValidationError') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST)
            }
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getTeamById(teamId: string): Promise<Team> {
        try {
            const team = await this.teamModel.findById(teamId).exec()
            if(team != null) {
                const returnData = {
                    id: team.id,
                    name: team.name,
                    users: team.users,
                    products: team.products,
                    createdAt: team.createdAt,
                    updatedAt: team.updatedAt
                }
                return returnData as Team
            }
            throw new HttpException('Team not found', HttpStatus.NOT_FOUND)
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

    async updateTeam(teamId: string, teamData: UpdateTeamDto): Promise<Team> {
        try {
            const team = await this.teamModel.findById(teamId).exec()
            if(team != null) {
                const prevUserIds = team.users.map((user: any)=>user.toString())
                const newUserIds= teamData.users || null
                Object.assign(team, teamData)
                const updateTeam = await team.save()
                if(Array.isArray(newUserIds)) {
                    const {add, remove} = await this.commonService.changeable_ids(newUserIds, prevUserIds)
                    if(add.length) await this.userModel.updateMany({'_id': add}, {$addToSet: {teams: updateTeam.id}})
                    if(remove.length) await this.userModel.updateMany({'_id': remove}, {$pull: {teams: updateTeam.id}})
                }
                const returnData = {
                    id: updateTeam.id,
                    name: updateTeam.name,
                    users: updateTeam.users,
                    products: updateTeam.products,
                    createdAt: updateTeam.createdAt,
                    updatedAt: updateTeam.updatedAt
                }
                return returnData as Team
            }
            throw new HttpException('Team not found', HttpStatus.NOT_FOUND)

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

    async deleteTeam(teamId: string): Promise<string> {
        try {
            const team = await this.teamModel.findByIdAndDelete(teamId).exec()
            if(team != null) {
                await this.userModel.updateMany({'_id': team.users}, {$pull: {teams: team.id}})
                return `${team.name} team has been deleted successfully`
            }
            throw new HttpException('Team not found', HttpStatus.NOT_FOUND)
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
