import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateRoleDto } from './dto';
import { RoleService } from './role.service';

@ApiTags('role')
@Controller()
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @Get()
    roleList() {
        return this.roleService.roleList()
    }
    
    @Post()
    addRole(@Body() createRoleDto: CreateRoleDto) {
        return this.roleService.addRole(createRoleDto)
    }

    @Get(':id')
    roleById(@Param('id') roleId: string) {
        return this.roleService.roleById(roleId)
    }

    @Patch(':id')
    editRole(@Body() updateRoleDto: CreateRoleDto, @Param('id') roleId: string) {
        return this.roleService.editRole(roleId, updateRoleDto)
    }

    @Delete(':id')
    deleteRole(@Param('id') roleId: string) {
        return this.roleService.deleteRole(roleId)
    }

}
