import { Controller, Get, UseGuards, Res, Param, StreamableFile, HttpException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import type { Response } from "express";
import { HttpAuthGuard } from "src/auth/auth.guard";
import { SetupGuard } from "src/guards/setup.guard";
import { catchError, map } from "rxjs";
import axios from "axios";

@Controller("media")
@UseGuards(HttpAuthGuard, SetupGuard)
export class MediaController {

	constructor(private readonly httpService: HttpService) {}
	
	//https://stackoverflow.com/questions/34571784/how-to-use-parameters-containing-a-slash-character
	//@Get("tenor/:path((?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?\/[A-Za-z0-9]+.gif)")
	@Get("tenor/:path([^/]+/[^/]+)")
	async pipe_tenor_media(@Param("path") path: string) {
		try {
			return new StreamableFile((await axios.get(`https://media.tenor.com/${path}`, { responseType: "stream" })).data);
		} catch (error) {
			console.log("tenor", error);
			throw new HttpException(error.response.statusText, error.response.status);
		}
		/*const tmp = this.httpService.get(`https://media.tenor.com/${a}/${b}`, { responseType: "stream" })
			.pipe(catchError(error =>{
				throw "shit";
			})).pipe(map(x => x.data.pipe(response)));
		tmp.subscribe({complete: () => response.send()});*/
		//return response.send();
	}
}
