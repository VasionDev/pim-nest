import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { User } from "./decorator";
import { LoginDto, ManagePasswordDto, ResetDto } from "./dto";
import { JwtAuthGuard } from "./guard";
import { JwtRtAuthGuard } from "./guard/jwt-rt-auth.guard";

@UseGuards(JwtAuthGuard)
@ApiTags('auth')
@Controller()
export class AuthController {

    constructor(private readonly authService: AuthService) {}

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto)
    }

    @Post('super-user')
    superUser() {
        return this.authService.superUser()
    }

    @UseGuards(JwtRtAuthGuard)
    @Get('access-token')
    newAccessToken(
        @User('id') userId: string,
        @User('email') email: string
    ) {
        return this.authService.generateTokens(userId, email)
    }

    @Post('password')
    resetPassword(@Body() resetDto: ResetDto) {
        return this.authService.resetPassword(resetDto.email)
    }

    @Post('password/:id/:token')
    managePassword(@Body() passwordDto: ManagePasswordDto, @Param('id') id: string, @Param('token') token: string) {
        return this.authService.managePassword(id, token, passwordDto.password)
    }

    @Get('verification')
    verifyLink(@Query('id') id: string, @Query('token') token: string) {
        return this.authService.verifyLink(id, token)
    }

}