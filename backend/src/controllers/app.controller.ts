import {
	Get,
	Controller,
	Query,
	HttpException,
	BadRequestException,
	UnsupportedMediaTypeException,
	StreamableFile,
	UseGuards,
} from "@nestjs/common";

import {
	genName
} from "../namegen";
import validator from "validator";
import axios from "axios";
import { HttpAuthGuard } from "src/auth/auth.guard";
import { SetupGuard } from "src/guards/setup.guard";

@Controller()
@UseGuards(HttpAuthGuard, SetupGuard)
export class AppController {
	@Get("/room-name")
	roomName() {
		return genName();
	}

	@Get("proxy")
	async media_proxy(@Query("url") url: string) {
		if (!validator.isURL(url, {
			protocols: ['https'],
			require_protocol: true,
			require_valid_protocol: true,
			require_host: true,
			allow_protocol_relative_urls: false,
			allow_fragments: false,
		})) {
			throw new BadRequestException("Invalid URL");
		}

		let response;

		try {
			response = await axios.get(url, { responseType: "stream" });
		} catch (error) {
			throw new HttpException(error.response.statusText, error.resposne.status);
		}

		const type = response.headers["content-type"];
		if (!validator.isMimeType(type) || !type.startsWith("image/"))
			throw new UnsupportedMediaTypeException();
		return new StreamableFile(response.data);
	}
}
