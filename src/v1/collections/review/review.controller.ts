import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReviewDto } from './dto';
import { ReviewService } from './review.service';

@ApiTags('review')
@Controller()
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) {}

    @Get()
    getReviewList() {
        return this.reviewService.getReviewList()
    }

    @Post()
    addReview(@Body() reviewCreateDto: ReviewDto) {
        return this.reviewService.addReview(reviewCreateDto)
    }

    @Get(':id')
    getReviewById(@Param('id') reviewId: string) {
        return this.reviewService.getReviewById(reviewId)
    }

    @Patch(':id')
    updateReview(@Param('id') reviewId: string, @Body() reviewUpdateDto: ReviewDto) {
        return this.reviewService.updateReview(reviewId, reviewUpdateDto)
    }

    @Delete(':id')
    deleteReview(@Param('id') reviewId: string) {
        return this.reviewService.deleteReview(reviewId)
    }
}
