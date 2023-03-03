import { Controller, Get, UseGuards, Res, Query, StreamableFile, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import type { Response } from "express";
import { HttpAuthGuard } from "src/auth/auth.guard";
import { SetupGuard } from "src/guards/setup.guard";
import { catchError, map, filter } from "rxjs";
import axios from "axios";
import { TENOR_KEY } from "src/vars";

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
	itermurl: string;
	hascaption: boolean;
	flags: string;
	bg_color: string;
	url: string;
}

@Controller("media")
@UseGuards(HttpAuthGuard, SetupGuard)
export class MediaController {

	constructor(private readonly httpService: HttpService) { }

	@Get("tenor")
	async tenor(@Query("query") query: string, @Res() response: Response) {
		const res = this.httpService.get<{ results: ResponseObject[], next: string }>(`https://tenor.googleapis.com/v2/search?q=${query}&key=${TENOR_KEY}&limit=10&media_filter=tinygif`);
		response.status(HttpStatus.OK).contentType("application/json");
		res.subscribe(
			(value) => {
				response.write(JSON.stringify(value.data.results.map((gif) => {
					let url = gif.media_formats["tinygif"];
					return {
						title: gif.title,
						desc: gif.content_description,
						url: url?.url,
						width: url?.dims[0],
						height: url?.dims[1],
					};
				})));
			},
			(error) => console.error(error),
			() => response.send(),
		);
	}
}
