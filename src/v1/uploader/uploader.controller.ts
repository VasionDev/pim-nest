import { Controller, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { uploadOptions } from './config';
import { UploaderService } from './uploader.service';

@ApiTags('uploader')
@Controller()
export class UploaderController {
    constructor(private readonly uploaderService: UploaderService) {}

    @Post('image')
    @ApiQuery({name: 'uploadTo', required: false})
    @UseInterceptors(AnyFilesInterceptor(uploadOptions))
    uploadImageFile(@UploadedFiles() files: Array<Express.Multer.File>, @Query('uploadTo') uploadTo: string) {
        const folderName = uploadTo && uploadTo !== '' ? uploadTo : 'default'
        return this.uploaderService.uploadImageFileToCloudinary(files[0], folderName)
    }
}
