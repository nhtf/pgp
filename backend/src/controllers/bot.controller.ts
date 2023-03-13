import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { HttpAuthGuard } from "src/auth/auth.guard"; 
import { SetupGuard } from "src/guards/setup.guard"; 

@Controller("bot(s)?")
@UseGuards(HttpAuthGuard, SetupGuard)
export class BotController {

}
