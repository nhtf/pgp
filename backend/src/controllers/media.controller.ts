import { Controller, Get, UseGuards, Res, Query, HttpStatus, NotFoundException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import type { Response } from "express";
import { HttpAuthGuard } from "src/auth/auth.guard";
import { SetupGuard } from "src/guards/setup.guard";
import { TENOR_KEY, GIPHY_KEY } from "src/vars";
import { get_bouncer_proxy_url } from "src/util";

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

interface SearchResult {
	title: string;
	desc: string;
	src: string;
	width: number;
	height: number;
}

const search_limit = 10;

@Controller("media")
@UseGuards(HttpAuthGuard, SetupGuard)
export class MediaController {

	constructor(private readonly httpService: HttpService) { }

	@Get("tenor")
	async tenor(@Query("query") query: string) {
		const res = this.httpService.get<{ results: ResponseObject[], next: string }>(`https://tenor.googleapis.com/v2/search?q=${query}&key=${TENOR_KEY}&limit=${search_limit}&media_filter=tinygif`);


		const promise = new Promise((resolve: (results: SearchResult[]) => void, reject) => {
			const results: SearchResult[] = [];

			res.subscribe(
				(value) => {
					const tmp = value.data.results.map((gif) => {
						let url = gif.media_formats["tinygif"];
						return {
							title: gif.title,
							desc: gif.content_description,
							url: gif.itemurl,
							src: get_bouncer_proxy_url(new URL(url?.url)),
							width: url?.dims[0],
							height: url?.dims[1],
						};
					});
					results.push(...tmp);
				},
				(error) => { reject(error) },
				() => resolve(results),
			);
		});

		try {
			return await promise;
		} catch {
			throw new NotFoundException();
		}
	}

	@Get("giphy")
	async giphy(@Query("query") query: string) {
		const res = this.httpService.get<GiphySearchResponse>(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${query}&limit=${search_limit}`);

		const promise = new Promise((resolve: (results: SearchResult[]) => void, reject) => {
			const results: SearchResult[] = [];

			res.subscribe(
				(value) => {

					const tmp = value.data.data.map((gif) => {
						return {
							title: gif.title,
							desc: gif.alt_text,
							url: gif.url,
							src: get_bouncer_proxy_url(new URL(gif.images.downsized.url)),
							width: Number(gif.images.downsized.width),
							height: Number(gif.images.downsized.height),
						};
					});

					results.push(...tmp);

				},
				(error) => reject(error),
				() => resolve(results),
			);
		});

		try {
			return await promise;
		} catch {
			throw new NotFoundException();
		}
	}
}
