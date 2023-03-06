import { Controller, Get, UseGuards, Res, Query, StreamableFile, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import type { Response } from "express";
import { HttpAuthGuard } from "src/auth/auth.guard";
import { SetupGuard } from "src/guards/setup.guard";
import { catchError, map, filter } from "rxjs";
import axios from "axios";
import { TENOR_KEY, GIPHY_KEY } from "src/vars";

interface MediaObject {
	url: string;
	dims: number[];
	duration: number;
	size: number;
}

interface ResponseObject {
	created: number;
	hasaudio: boolean;
	id: string;
	media_formats: { [content_type: string]: MediaObject }; 
	tags: string[];
	title: string;
	content_description: string;
	itemurl: string;
	hascaption: boolean;
	flags: string;
	bg_color: string;
	url: string;
}

interface GiphyUser {
	avatar_url: string;
	banner_url: string;
	profile_url: string;
	username: string;
	display_name: string;
}

type GiphyHasDimensions = {
	width: string,
	height: string,
};

type GiphyImageDefault = {
	url: string,
} & GiphyHasDimensions;

type GiphySized = {
	size: string,
};

type GiphyMp4Sized = {
	mp4_size: string;
};

type GiphyMp4 = {
	mp4: string;
};

type GiphyHasMp4 = GiphyMp4 & GiphyMp4Sized;

type GiphyHasWebp = {
	webp: string,
	webp_size: string,
};

interface GiphyImagesObject {
	fixed_height: GiphyImageDefault & GiphySized & GiphyHasMp4 & GiphyHasWebp;
	fixed_height_still: GiphyImageDefault;
	fixed_height_downsampled: GiphyImageDefault & GiphySized & GiphyHasWebp;
	fixed_width: GiphyImageDefault & GiphySized & GiphyHasMp4 & GiphyHasWebp;
	fixed_width_still: GiphyImageDefault;
	fixed_width_downsampled: GiphyImageDefault & GiphySized & GiphyHasWebp;
	fixed_height_small: GiphyImageDefault & GiphySized & GiphyHasMp4 & GiphyHasWebp;
	fixed_height_small_still: GiphyImageDefault;
	fixed_width_small: GiphyImageDefault & GiphySized & GiphyHasMp4 & GiphyHasWebp;
	fixed_width_small_still: GiphyImageDefault;
	downsized: GiphyImageDefault & GiphySized;
	downsized_still: GiphyImageDefault;
	downsized_large: GiphyImageDefault & GiphySized;
	downsized_medium: GiphyImageDefault & GiphySized;
	downsized_small: GiphyImageDefault & GiphyMp4Sized;
	original: GiphyImageDefault & { frames: string } & GiphyHasMp4 & GiphyHasWebp;
	original_still: GiphyImageDefault;
	looping: GiphyMp4;
	preview: GiphyHasMp4 & GiphyHasDimensions;
	preview_gif: GiphyImageDefault;
}

interface GiphyMetaObject {
	msg: string;
	status: number;
	response_id: string;
}

interface GiphyPaginationObject {
	offset: number;
	total_count: number;
	count: number;
}

interface GiphyGifObject {
	type: string;
	id: string;
	slug: string;
	url: string;
	bitly_url: string;
	embed_url: string;
	username: string;
	source: string;
	rating: string;
	content_url: string;
	user: GiphyUser;
	source_tld: string;
	source_post_url: string;
	update_datetime: string;
	create_datetime: string;
	import_datetime: string;
	trending_datetime: string;
	images: GiphyImagesObject;
	title: string;
	alt_text: string;
}

interface GiphySearchResponse {
	data: GiphyGifObject[];
	pagination: GiphyPaginationObject;
	meta: GiphyMetaObject;
}

const search_limit = 10;

@Controller("media")
@UseGuards(HttpAuthGuard, SetupGuard)
export class MediaController {

	constructor(private readonly httpService: HttpService) { }

	@Get("tenor")
	async tenor(@Query("query") query: string, @Res() response: Response) {
		const res = this.httpService.get<{ results: ResponseObject[], next: string }>(`https://tenor.googleapis.com/v2/search?q=${query}&key=${TENOR_KEY}&limit=${search_limit}&media_filter=tinygif`);
		response.status(HttpStatus.OK).contentType("application/json");
		res.subscribe(
			(value) => {
				response.write(JSON.stringify(value.data.results.map((gif) => {
					let url = gif.media_formats["tinygif"];
					return {
						title: gif.title,
						desc: gif.content_description,
						url: gif.itemurl,
						src: url?.url,
						width: url?.dims[0],
						height: url?.dims[1],
					};
				})));
			},
			(error) => console.error(error),
			() => response.send(),
		);

		return {};
	}

	@Get("giphy")
	async giphy(@Query("query") query: string, @Res() response: Response) {
		const res = this.httpService.get<GiphySearchResponse>(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${query}&limit=${search_limit}`);
		response.status(HttpStatus.OK).contentType("application/json");
		res.subscribe(
			(value) => {
				response.write(JSON.stringify(value.data.data.map((gif) => {
					return {
						title: gif.title,
						desc: gif.alt_text,
						url: gif.url,
						src: gif.images.downsized.url,
						width: gif.images.downsized.width,
						height: gif.images.downsized.height,
					};
				})));
			},
			(error) => console.error(error),
			() => response.send(),
		);
	}
}
