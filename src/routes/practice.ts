import { Application } from "pixi.js";
import { Config } from "../types/Config";
import { CogSpeedGraphicsHandler } from "../ui/handler";


/**
 * Performs the practice test mode.
 * This consists of arrows and self paced modes in order to teach
 * the user how to correlate the answer and query buttons correctly.
 */
export class PracticeCogSpeed {
    constructor(
        public config: Config,
        private app: Application | null = null,
        private ui: CogSpeedGraphicsHandler | null = null,
        private fatigueLevel: number | null = null
    ) {}

    

    public async start() {
        
    }
}