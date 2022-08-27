import { Injectable } from "@nestjs/common";
import slugify from "slugify";

@Injectable()
export class CommonService {

    // utilities functions
    async changeable_ids(newIds: string[], prevIds: string[]): Promise<{add: string[], remove: string[]}> {
        const add = newIds.filter(e => !prevIds.includes(e))
        const remove = prevIds.filter(e => !newIds.includes(e))
        return {add, remove}
    }

    getSlug(name: string): string {
        slugify.extend({'®': '', '™': ''})
        const filterString = name.replace(/\/\//g, ' ')
        const slug = slugify(filterString, {
            lower: true,
            strict: true,
            trim: true,
            remove: /[^a-zA-Z0-9 ]/g
        })
        return slug
    }
}